import { Host } from "src/host/host";
import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { FunctionInfo } from "src/language/function-info";
import { IdentifierSymbol } from "src/language/identifier-symbol";
import { Expression, Statement } from "src/language/node";
import { infixParselets, prefixParselets } from "src/language/operator-grammar";
import { PropertyInfo } from "src/language/property-info";
import { Scope } from "src/language/scope";
import { SourceFile } from "src/language/source-file";
import { SymbolTable } from "src/language/symbol-table";
import { TokenLike } from "src/language/token";
import { TokenParser } from "src/language/token-parser";
import { TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import { ModelType, ProtocolType } from "src/language/types/type-system";
import { Lexer } from "src/lexer/lexer";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";
import { DoWhileStatementNode } from "src/parser/nodes/do-while-statement-node";
import { ElseStatementNode } from "src/parser/nodes/else-statement-node";
import { ExpressionStatementNode } from "src/parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "src/parser/nodes/function-declaration-node";
import { IfStatementNode } from "src/parser/nodes/if-statement-node";
import { ModelNode } from "src/parser/nodes/model-node";
import { ProgramNode } from "src/parser/nodes/program-node";
import { ProtocolNode } from "src/parser/nodes/protocol-node";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";
import { WhileStatementNode } from "src/parser/nodes/while-statement-node";
import { ParsedParameters } from "src/parser/parsed-parameters";
import { InfixParselet } from "src/parser/parselet";

export class Parser extends TokenParser {
	/** Parsing environment containing symbol table and function table */
	public readonly env: Environment;

	public get symbolTable(): SymbolTable {
		return this.env.symbolTable;
	}

	public get functionTable(): Map<string, FunctionInfo> {
		return this.env.functionTable;
	}

	public get scope(): Scope {
		return this.symbolTable.scope;
	}

	public get models(): Map<string, ModelType> {
		return this.env.models;
	}

	public get protocols(): Map<string, ProtocolType> {
		return this.env.protocols;
	}

	constructor(
		/** File to parse */
		public readonly file: SourceFile
	) {
		super(new Lexer(file));
		// Todo: Allow environment to be pre-configured
		this.env = new Environment(
			new SymbolTable(new Scope()),
			new Map<string, FunctionInfo>(),
			new Map<string, ProtocolType>(),
			new Map<string, ModelType>(),
			new Host()
		);
	}

	///
	///
	/// Recursive Descent Parsing Methods
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
					this.consumeEndOfStatement("Expected end of preprocessor statement");
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
		return new AbstractSyntaxTree(root, this.env);
	}

	public statement(): Statement {
		// See what we're looking at to figure out what kind of statement
		// production to make
		if (this.match(TokenType.Let, TokenType.Var)) {
			return this.variableDeclaration();
		} else if (this.match(TokenType.Function)) {
			// Function definition
			return this.functionDeclaration();
		} else if (this.match(TokenType.Return)) {
			return this.returnStatement();
		} else if (this.match(TokenType.If)) {
			return this.ifStatement();
		} else if (this.match(TokenType.While)) {
			return this.whileStatement();
		} else if (this.match(TokenType.Do)) {
			return this.doWhileStatement();
		} else if (this.match(TokenType.Model)) {
			return this.model();
		} else if (this.match(TokenType.Protocol)) {
			return this.protocol();
		} else if (this.match(TokenType.BraceOpen)) {
			// Match a block statement
			return this.block();
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
			// Create a new scope and push it on the scope stack
			// (Only if we're not a function block -- it brings its own scope)
			this.createScope();
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
		if (!isFunctionBlock) this.exitScope();
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
		const node: VariableDeclarationNode = new VariableDeclarationNode(
			nameToken,
			start,
			end,
			isImmutable,
			expr,
			typeAnnotation
		);
		// Register the declared variable in the current scope
		this.symbolTable.scope.register(
			new IdentifierSymbol(nameToken.lexeme, nameToken, isImmutable)
		);
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
		if (!this.scope.isGlobalScope) {
			throw this.error(
				this.previous,
				"Functions can only be declared in global scope"
			);
		}
		// Function keyword has already been matched for us
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
		this.match(TokenType.ParenOpen);
		const parameters = this.parameterList();
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
			parameters.names,
			parameters.types
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
		this.createScope();

		let i = 0;
		for (const param of parameters.names) {
			// Register each of the function's parameters in the current scope
			this.scope.register(
				new IdentifierSymbol(param, parameters.tokens[i], false)
			);
			i++;
		}

		// Grab the block of statements inside the function curly braces
		const block = this.block(true);

		// Pop the scope for this function
		this.exitScope();

		const node = new FunctionDeclarationNode(nameToken, start, info, block);
		return node;
	}

	/** Parse a parameter sequence */
	public parameterList(): ParsedParameters {
		const types: Map<string, string[]> = new Map();
		const names: string[] = [];
		const tokens: TokenLike[] = [];
		if (!this.isAtEnd && this.peek.type !== TokenType.ParenClose) {
			do {
				const paramToken = this.consume(
					TokenType.Id,
					"Expected parameter name"
				);
				const paramName = paramToken.lexeme;
				tokens.push(paramToken);
				this.consume(
					TokenType.Colon,
					"Expected colon for parameter type annotation"
				);
				// Attempt to match one or more parameters
				const paramType = this.typeAnnotation();
				if (types.has(paramName)) {
					throw this.error(paramToken, "Duplicate parameter name found");
				}
				// Store the parameter information in the node
				types.set(paramName, paramType);
				names.push(paramName);
			} while (this.match(TokenType.Comma));
		}
		return new ParsedParameters(types, names, tokens);
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
		this.consume(TokenType.BraceOpen, "Expected opening brace of if block");
		const consequent = this.block();
		const alternates: ElseStatementNode[] = [];
		// Keep track of whether or not we have found a catch-all else block
		// as in `else { }`
		// This enables error reporting since we support `else if` sequences
		let catchAllElseSeen = false;
		while (this.match(TokenType.Else)) {
			const token = this.previous;
			const expr = this.match(TokenType.If) ? this.expression() : undefined;
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
			this.consume(
				TokenType.BraceOpen,
				"Expected opening brace of `else" + (expr ? " if` block" : "` block")
			);
			const block = this.block();
			const alternate = new ElseStatementNode(token, expr, block);
			alternates.push(alternate);
		}
		return new IfStatementNode(token, predicate, consequent, alternates);
	}

	public doWhileStatement(): DoWhileStatementNode {
		const token = this.previous;
		this.eatLines();
		this.consume(TokenType.BraceOpen, "Expected opening brace of while block");
		const block = this.block();
		this.consume(TokenType.While, "Expected while keyword");
		const condition = this.expression();
		return new DoWhileStatementNode(token, block, condition);
	}

	public model(): ModelNode {
		const token = this.previous;
		this.consume(TokenType.Id, "Expected model name");
		const nameToken = this.previous;
		const modelName = nameToken.lexeme;
		this.eatLines();
		this.consume(TokenType.BraceOpen, "Expected opening brace of model block");
		this.eatLines();
		const initParams: PropertyInfo[] = [];
		if (this.match(TokenType.ParenOpen)) {
			const parameters = this.parameterList();
			for (const name of parameters.names) {
				initParams.push(
					new PropertyInfo(name, parameters.types.get(name)!, true)
				);
			}
			this.eatLines();
			// Model has initialization parameters
			this.consume(TokenType.ParenClose, "Expected closing parenthesis");
			this.eatLines();
		}

		const propertyDeclarations: VariableDeclarationNode[] = [];
		while (this.match(TokenType.Let, TokenType.Var)) {
			const decl = this.variableDeclaration();
			decl.existsInModel = true;
			propertyDeclarations.push(decl);
		}
		return new ModelNode(token, modelName, initParams, propertyDeclarations);
	}

	public protocol(): ProtocolNode {
		return new ProtocolNode(this.previous);
	}

	public whileStatement(): WhileStatementNode {
		const token = this.previous;
		const condition = this.expression();
		this.consume(TokenType.BraceOpen, "Expected opening brace of while block");
		const block = this.block();
		return new WhileStatementNode(token, condition, block);
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

	private createScope(): void {
		// Create a new scope
		this.scope.addScope();
		// Enter the newly created scope
		this.symbolTable.enterScope();
	}

	private exitScope(): void {
		this.symbolTable.exitScope();
	}
}
