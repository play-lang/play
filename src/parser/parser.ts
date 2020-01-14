import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { FunctionInfo } from "src/language/function-info";
import { Expression, Statement } from "src/language/node";
import { infixParselets, prefixParselets } from "src/language/operator-grammar";
import { SymbolTable } from "src/language/symbol-table";
import { TokenLike } from "src/language/token";
import { TokenParser } from "src/language/token-parser";
import { TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import { Lexer } from "src/lexer/lexer";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";
import { ElseStatementNode } from "src/parser/nodes/else-statement-node";
import { ExpressionStatementNode } from "src/parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "src/parser/nodes/function-declaration-node";
import { IfStatementNode } from "src/parser/nodes/if-statement-node";
import { ProgramNode } from "src/parser/nodes/program-node";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";
import { InfixParselet } from "src/parser/parselet";

export class Parser extends TokenParser {
	/** Global scope symbol table */
	public get globalScope(): SymbolTable {
		return this._symbolTables[0];
	}

	/** Active symbol table for the current scope */
	public get symbolTable(): SymbolTable {
		return this._symbolTables[this._symbolTables.length - 1];
	}

	/**
	 * Context names mapped to function nodes
	 * This allows us to look-up functions by name without having to walk the tree
	 */
	public readonly functionTable: Map<string, FunctionInfo> = new Map();

	/** Symbol table pointer stack for tracking scopes */
	protected _symbolTables: SymbolTable[] = [];
	/** Number of scopes encountered */
	protected _scopes: number = 0;

	constructor(contents: string) {
		// Todo: Update for file table when preprocessor is ready
		super(new Lexer(contents));
		this._symbolTables.push(new SymbolTable());
		this._token = this.lexer.token;
		this._previous = this._token;
	}

	///
	///
	/// Recursive Descent
	///
	/// Parsing Methods
	///
	///

	public parse(): AbstractSyntaxTree {
		this.eatLines();
		const statements: Statement[] = [];
		while (!this.isAtEnd) {
			try {
				this.eatLines();
				while (this.match(TokenType.PoundSign)) {
					// Gobble up any preprocessor statements
					this.consume(
						TokenType.Include,
						"Include preprocessor command expected"
					);
					this.consume(TokenType.String, "Include filename expected");
					this.consumeEndOfStatement(
						"Expected end of preprocessor statement"
					);
					this.eatLines();
				}
				// A program consists of a series of statements
				statements.push(this.statement());
				// Expect a new line or eof token after each statement
				this.consumeEndOfStatement();
				// this.eatLines();
			} catch (e) {
				this.synchronize();
			}
		}
		// Calculate start and end in the input string
		const start = 0;
		const end =
			statements.length < 1
				? this.previous.end
				: statements[statements.length - 1].end;
		const root = new ProgramNode(this.previous, start, end, statements);
		const env = new Environment(this.symbolTable, this.functionTable);
		return new AbstractSyntaxTree(root, env);
	}

	public statement(): Statement {
		// See what we're looking at to figure out what kind of statement
		// production to make
		if (this.match(TokenType.Let, TokenType.Var)) {
			return this.variableDeclaration();
		} else if (this.match(TokenType.BraceOpen)) {
			// Match a block statement
			return this.block();
		} else if (this.match(TokenType.Function)) {
			// Function definition
			return this.functionDeclaration();
		} else if (this.match(TokenType.Return)) {
			return this.returnStatement();
		} else if (this.match(TokenType.If)) {
			return this.ifStatement();
		} else {
			// An unrecognized statement must be an expression statement
			return this.expressionStatement();
		}
	}

	/**
	 * Parse a block statement, optionally specifying if it represents an
	 * function block
	 */
	public block(isFunctionBlock: boolean = false): BlockStatementNode {
		// Brace open has already been matched for us
		const startToken = this.previous;
		const start = this.previous.pos;
		this.eatLines();
		if (!isFunctionBlock) {
			// Create a new symbol table scope and push it on the symbol table stack
			// (Only if we're not a function block -- it brings its own symbol table)
			this._symbolTables.push(this.symbolTable.addScope());
		}
		const statements: Statement[] = [];
		while (!this.isAtEnd && this.peek.type !== TokenType.BraceClose) {
			statements.push(this.statement());
			if (this.peek.type !== TokenType.BraceClose) {
				// Expect new line at end of statement if we don't find the block's
				// closing brace
				//
				// Otherwise, the closing brace is fine for marking the end of the
				// statement here
				this.consumeEndOfStatement();
				this.eatLines();
			}
		}
		this.eatLines();
		this.consume(TokenType.BraceClose, "Expected closing brace for block");
		// Pop the scope
		if (!isFunctionBlock) this._symbolTables.pop();
		// Calculate start and end in the input string
		const end =
			statements.length < 1
				? this.previous.end
				: statements[statements.length - 1].end;
		return new BlockStatementNode(
			startToken,
			start,
			end,
			statements,
			isFunctionBlock
		);
	}

	/**
	 * Utility parsing method to parse a type annotation in code and
	 * return it as an array of strings
	 */
	public typeAnnotation(): string[] {
		// Colon has already been matched for us
		const typeAnnotation: string[] = [];
		if (
			this.match(
				TokenType.Id,
				TokenType.Str,
				TokenType.Num,
				TokenType.Bool
			)
		) {
			typeAnnotation.push(this.previous.lexeme);
		} else {
			throw this.error(this.peek, "Expected type annotation");
		}
		while (
			this.peek.type === TokenType.List ||
			this.peek.type === TokenType.Map ||
			this.peek.type === TokenType.Set
		) {
			// Consume any following "list" or "map" collection type modifiers
			typeAnnotation.push(this.advance().lexeme);
		}
		return typeAnnotation;
	}

	/**
	 * Parse a variable declaration
	 * Example: num list numbers = [1, 2, 3]
	 *
	 * @param leadingType First identifier already matched--must be the
	 * deepest type in the expression (a num, str, or user-defined type)
	 */
	public variableDeclaration(): VariableDeclarationNode {
		// We've already matched the reserved word token if we make it here
		const start = this.previous.pos;
		const isImmutable = this.previous.type === TokenType.Let;
		const nameToken = this.consume(TokenType.Id, "Expected variable name");
		let typeAnnotation: string[] | undefined;
		if (this.match(TokenType.Colon)) {
			// Expect a colon for a type annotation -> let x: num = 10
			// Type annotation identifiers follow the colon:
			typeAnnotation = this.typeAnnotation();
		}
		// Variable declarations may be followed by an equals sign to initialize
		// the value, otherwise we initialize the zero-value for it
		let expr: Expression | undefined;
		let end = this.previous.end;
		if (this.match(TokenType.Equal)) {
			// Only parse an expression if the variable declaration has an equals
			// sign following the type annotation
			expr = this.expression();
			end = expr.end;
		}
		if (!typeAnnotation && !expr) {
			throw this.error(
				nameToken,
				"Variable must have a type or an assigned value to synthesize a type from"
			);
		}
		// TODO: Don't register types in the symbol table until type-check time
		const node: VariableDeclarationNode = new VariableDeclarationNode(
			nameToken,
			start,
			end,
			isImmutable,
			expr,
			typeAnnotation
		);
		// Register the declared variable in the symbol table
		this.symbolTable.register({
			token: nameToken,
			name: nameToken.lexeme,
			isImmutable,
		});
		return node;
	}

	/**
	 * Parse a function declaration
	 *
	 * e.g.,
	 *
	 * ```
	 * function str map makeStringMap(str param1, str param2) {
	 *   ...
	 * }
	 * ```
	 */
	public functionDeclaration(): FunctionDeclarationNode {
		if (!this.symbolTable.isGlobalScope) {
			throw this.error(
				this.previous,
				"Functions can only be declared in global scope"
			);
		}
		// Function keyword has already been matched for us
		const startToken = this.previous;
		const start = this.previous.pos;
		const nameToken = this.consume(
			TokenType.Id,
			"Expected function name following declaration"
		);
		const name = nameToken.lexeme;
		if (this.functionTable.has(name)) {
			throw this.error(
				nameToken,
				"Cannot redeclare function with the name `" + name + "`"
			);
		}
		const parameterTypes: Map<string, string[]> = new Map();
		const parameters: string[] = [];
		const paramTokens: TokenLike[] = [];
		this.match(TokenType.ParenOpen);
		if (!this.isAtEnd && this.peek.type !== TokenType.ParenClose) {
			do {
				const paramToken = this.consume(
					TokenType.Id,
					"Expected parameter name"
				);
				const paramName = paramToken.lexeme;
				paramTokens.push(paramToken);
				this.consume(
					TokenType.Colon,
					"Expected colon for parameter type annotation"
				);
				// Attempt to match one or more parameters
				const paramType = this.typeAnnotation();
				if (parameterTypes.has(paramName)) {
					throw this.error(
						paramToken,
						"Function cannot have parameters with duplicate names"
					);
				}
				// Store the parameter information in the node
				parameterTypes.set(paramName, paramType);
				parameters.push(paramName);
			} while (this.match(TokenType.Comma));
		}
		this.match(TokenType.ParenClose);
		// Optionally match a type annotation following function
		// parameter parenthesis -> function doSomething(a: num): str {}
		//                                                       ^
		const typeAnnotation = this.match(TokenType.Colon)
			? this.typeAnnotation()
			: [];
		// Create a node
		const info = new FunctionInfo(
			name,
			typeAnnotation,
			parameters,
			parameterTypes
		);
		// Register the function name and the function info that it points to
		// This will make compilation of functions simpler since we can look up
		// how many parameters and what kind a function takes when we call it
		this.functionTable.set(name, info);
		// Start parsing the function block
		this.consume(
			TokenType.BraceOpen,
			"Expected opening brace of function block"
		);

		// Create a scope for this function
		this._symbolTables.push(this.symbolTable.addScope());

		let i = 0;
		for (const param of parameters) {
			// Register each parameter in the function's symbol table
			this.symbolTable.register({
				name: param,
				token: paramTokens[i],
				isImmutable: false,
			});
			i++;
		}

		// Grab the block of statements inside the function curly braces
		const block = this.block(true);

		// Ensure that the last statement in the function is a return statement
		const lastStatement = block.statements[block.statements.length - 1];
		if (!(lastStatement instanceof ReturnStatementNode)) {
			block.statements.push(new ReturnStatementNode(startToken));
		}

		// Pop the scope for this function
		this._symbolTables.pop();

		const node = new FunctionDeclarationNode(nameToken, start, info, block);
		return node;
	}

	public returnStatement(): ReturnStatementNode {
		// Return keyword has already been matched
		//
		// If the end of the statement isn't found, assume there is a return value
		// expression to parse
		const expr: Expression | undefined = !this.isAtEndOfStatement
			? this.expression()
			: undefined;
		return new ReturnStatementNode(this.previous, expr);
	}

	public ifStatement(): IfStatementNode {
		const token = this.previous;
		const predicate = this.expression();
		const consequent = this.block();
		const alternates: ElseStatementNode[] = [];
		// Keep track of whether or not we have found a catch-all else block
		// as in `else { }`
		// This enables error reporting since we support `else if` sequences
		let catchAllElseSeen = false;
		while (this.match(TokenType.Else)) {
			const token = this.previous;
			const expr = this.match(TokenType.If)
				? this.expression()
				: undefined;
			if (!expr) {
				if (catchAllElseSeen) {
					throw this.error(
						token,
						"Only one catch-all `else` block may be present"
					);
				}
				catchAllElseSeen = true;
			}
			if (expr && catchAllElseSeen) {
				throw this.error(
					token,
					"An `else if` block must appear before a catch-all `else` block"
				);
			}
			const block = this.block();
			const alternate = new ElseStatementNode(token, expr, block);
			alternates.push(alternate);
		}
		return new IfStatementNode(token, predicate, consequent, alternates);
	}

	public expressionStatement(): ExpressionStatementNode {
		// Parse an unused expression as a single line statement
		return new ExpressionStatementNode(this.peek, this.expression());
	}

	/**
	 *
	 * @param precedence The minimum precedence required to parse the
	 * next operator
	 * @param token The first token (allows some methods to do some look-ahead
	 * to see if an expression production is merited)
	 */
	public expression(precedence: number = 0, token?: TokenLike): Expression {
		// return this.value();

		token = token || this.advance();
		const prefix = prefixParselets.get(token.type);
		if (!prefix) {
			throw this.error(token, "Expected start of expression");
		}
		let lhs = prefix.parse(this, token);
		while (precedence < this.getPrecedence()) {
			token = this.advance();
			const infix: InfixParselet = infixParselets.get(token.type)!;
			lhs = infix.parse(this, lhs, token);
		}
		return lhs;
	}

	public getPrecedence(): number {
		// Infix parser "parselets" have their own precedences set based
		// on the grammar
		//
		const parser = infixParselets.get(this.peek.type);
		if (parser) return parser.precedence;
		return 0;
	}
}
