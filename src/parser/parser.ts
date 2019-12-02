import { AbstractSyntaxTree } from "../language/abstract-syntax-tree";
import { ActionInfo } from "../language/action-info";
import { Expression, Statement } from "../language/node";
import { infixParselets, prefixParselets } from "../language/operator-grammar";
import SymbolTable from "../language/symbol-table";
import { TokenLike } from "../language/token";
import { TokenParser } from "../language/token-parser";
import { TokenType } from "../language/token-type";
import { Lexer } from "../lexer";
import { ActionDeclarationNode } from "./nodes/action-declaration-node";
import { BlockStatementNode } from "./nodes/block-statement-node";
import { ProgramNode } from "./nodes/program-node";
import { ReturnStatementNode } from "./nodes/return-statement-node";
import { ReturnValueStatementNode } from "./nodes/return-value-statement-node";
import { VariableDeclarationNode } from "./nodes/variable-declaration-node";
import { InfixParselet } from "./parselet";

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
	 * Context names mapped to action nodes
	 * This allows us to look-up functions by name without having to walk the tree
	 */
	public readonly actionTable: Map<string, ActionInfo> = new Map();

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
		const statements: Statement[] = [];
		while (!this.isAtEnd) {
			try {
				this.eatLines();
				// A program consists of a series of statements
				statements.push(this.statement());
				// Expect a new line or eof token after each statement
				this.consume(
					[TokenType.Line, TokenType.EndOfFile],
					"Expected end of statement"
				);
				this.eatLines();
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
		const root = new ProgramNode(start, end, statements);
		return new AbstractSyntaxTree(root, this.symbolTable, this.actionTable);
	}

	public statement(): Statement {
		// See what we're looking at to figure out what kind of statement
		// production to make
		if (this.match(TokenType.Let, TokenType.Var)) {
			return this.variableDeclaration();
		} else if (this.match(TokenType.Id)) {
			// Non-reserved identifier indicates an expression every time
			return this.expression(0, this.previous);
		} else if (this.match(TokenType.BraceOpen)) {
			// Match a block statement
			return this.block();
		} else if (this.match(TokenType.Action)) {
			// Function definition
			return this.actionDeclaration();
		} else if (this.match(TokenType.Return)) {
			return this.returnStatement();
		} else {
			// An unrecognized statement must be an expression statement
			return this.expression();
		}
	}

	/**
	 * Parse a block statement, optionally specifying if it represents an
	 * action block
	 */
	public block(isActionBlock: boolean = false): BlockStatementNode {
		// Brace open has already been matched for us
		const start = this.previous.pos;
		this.eatLines();
		if (!isActionBlock) {
			// Create a new symbol table scope and push it on the symbol table stack
			// (Only if we're not an action block -- it brings its own symbol table)
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
				this.consume(
					[TokenType.Line, TokenType.EndOfFile],
					"Expected end of statement"
				);
				this.eatLines();
			}
		}
		this.eatLines();
		this.consume(TokenType.BraceClose, "Expected closing brace for block");
		// Pop the scope
		if (!isActionBlock) this._symbolTables.pop();
		// Calculate start and end in the input string
		const end =
			statements.length < 1
				? this.previous.end
				: statements[statements.length - 1].end;
		return new BlockStatementNode(start, end, statements, isActionBlock);
	}

	/**
	 * Utility parsing method to parse a type annotation in code and
	 * return it as an array of strings
	 */
	public typeAnnotation(): string[] {
		// Colon has already been matched for us
		const typeAnnotation: string[] = [];
		if (
			this.match(TokenType.Id, TokenType.Str, TokenType.Num, TokenType.Bool)
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
		// Expect a colon for a type annotation -> let x: num = 10
		this.consume(
			TokenType.Colon,
			"Expected colon for variable type annotation"
		);
		// Type annotation identifiers follow the colon:
		const typeAnnotation = this.typeAnnotation();
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
		const node: VariableDeclarationNode = new VariableDeclarationNode(
			start,
			end,
			nameToken,
			typeAnnotation,
			isImmutable,
			expr
		);
		// Register the declared variable in the symbol table
		this.symbolTable.register(node);
		return node;
	}

	/**
	 * Parse an action declaration
	 *
	 * e.g.,
	 *
	 * ```
	 * action str map makeStringMap(str param1, str param2) {
	 *   ...
	 * }
	 * ```
	 */
	public actionDeclaration(): ActionDeclarationNode {
		// Action keyword has already been matched for us
		const start = this.previous.pos;
		const nameToken = this.consume(
			TokenType.Id,
			"Expected action name following declaration"
		);
		const name = nameToken.lexeme;
		if (this.actionTable.has(name)) {
			throw this.error(
				nameToken,
				"Cannot redeclare action with the name `" + name + "`"
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
				paramTokens.push(paramToken);
				this.consume(
					TokenType.Colon,
					"Expected colon for parameter type annotation"
				);
				// Attempt to match one or more parameters
				const paramType = this.typeAnnotation();
				// Store the parameter information in the node
				parameterTypes.set(paramToken.lexeme, paramType);
				parameters.push(paramToken.lexeme);
			} while (this.match(TokenType.Comma));
		}
		this.match(TokenType.ParenClose);
		// Optionally match a type annotation following function
		// parameter parenthesis -> action doSomething(a: num): str {}
		//                                                       ^
		const typeAnnotation = this.match(TokenType.Colon)
			? this.typeAnnotation()
			: [];
		// Create a node
		const info = new ActionInfo(
			name,
			typeAnnotation,
			parameters,
			parameterTypes
		);
		// Register the function name and the action info that it points to
		// This will make compilation of functions simpler since we can look up
		// how many parameters and what kind a function takes when we call it
		this.actionTable.set(name, info);
		// Start parsing the action block
		this.consume(TokenType.BraceOpen, "Expected opening brace of action block");

		// Create a scope for this action
		this._symbolTables.push(this.symbolTable.addScope());

		let i = 0;
		for (const param of parameters) {
			// Register each parameter in the action's symbol table
			this.symbolTable.register({
				name: param,
				token: paramTokens[i],
				typeAnnotation: parameterTypes.get(param)!,
				isImmutable: false,
			});
			i++;
		}

		// Grab the block of statements inside the function curly braces
		const block = this.block(true);

		const lastStatement = block.statements[block.statements.length - 1];
		if (
			!(lastStatement instanceof ReturnStatementNode) &&
			!(lastStatement instanceof ReturnValueStatementNode)
		) {
			block.statements.push(new ReturnStatementNode());
		}

		// Pop the scope for this action
		this._symbolTables.pop();

		const node = new ActionDeclarationNode(start, info, block);
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
		if (expr) {
			return new ReturnValueStatementNode(this.previous, expr);
		}
		return new ReturnStatementNode(this.previous);
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
