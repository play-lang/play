import { describeErrorToken, prepareHint } from "../common/format-messages";
import { AbstractSyntaxTree } from "../language/abstract-syntax-tree";
import { ActionInfo } from "../language/action-info";
import { Expression, Statement } from "../language/node";
import { infixParselets, prefixParselets } from "../language/operator-grammar";
import SymbolTable from "../language/symbol-table";
import { ErrorToken, TokenLike } from "../language/token";
import { TokenType } from "../language/token-type";
import { Lexer } from "../lexer";
import { ActionDeclarationNode } from "./nodes/action-declaration-node";
import { BlockStatementNode } from "./nodes/block-statement-node";
import { ProgramNode } from "./nodes/program-node";
import { ReturnStatementNode } from "./nodes/return-statement-node";
import { VariableDeclarationNode } from "./nodes/variable-declaration-node";
import { ParseError } from "./parse-error";
import { InfixParselet } from "./parselet";

export class Parser {
	/** Current token */
	public get peek(): TokenLike {
		return this._token;
	}

	/**
	 * Last token matched
	 *
	 * If no tokens have been matched this is equal to the first token
	 */
	public get previous(): TokenLike {
		return this._previous;
	}

	/** True if the parser has reached the end of a file */
	public get isAtEnd(): boolean {
		return this.peek.type === TokenType.EndOfFile;
	}

	/** Global scope symbol table */
	public get globalScope(): SymbolTable {
		return this._symbolTables[0];
	}

	/** Active symbol table for the current scope */
	public get symbolTable(): SymbolTable {
		return this._symbolTables[this._symbolTables.length - 1];
	}
	/** List of errors encountered in the code */
	public readonly errors: ParseError[] = [];

	/** Table containing every file encountered */
	public readonly fileTable: string[] = [];

	/** Lexer used to provide tokens as needed */
	public readonly lexer: Lexer;

	/**
	 * Context names mapped to action nodes
	 * This allows us to look-up functions by name without having to walk the tree
	 */
	public readonly actionTable: Map<string, ActionInfo> = new Map();

	/** True if the parser is in panic mode */
	protected isPanicking: boolean = false;
	/**
	 * Function to call when the contents of another file are needed
	 *
	 * Play supports "preprocessor"-like statements
	 *
	 * When an #insert clause is found indicating that the contents of
	 * another file should be inserted at the specified place in the language
	 * this function will be invoked to fetch the contents of the specified
	 * file
	 */
	protected fileProvider: (path: string) => Promise<string>;

	/** Current token */
	protected _token: TokenLike;
	/** Previous token */
	protected _previous: TokenLike;
	/** Symbol table pointer stack for tracking scopes */
	protected _symbolTables: SymbolTable[] = [];
	/** Number of scopes encountered */
	protected _scopes: number = 0;

	constructor(
		filename: string,
		contents: string,
		fileProvider: (path: string) => Promise<string> = async () => ""
	) {
		this.fileTable.push(filename);
		this.fileProvider = fileProvider;
		this.lexer = new Lexer(contents, 0);
		this._symbolTables.push(new SymbolTable());
		this._token = this.lexer.token;
		this._previous = this._token;
	}

	/**
	 * Returns true if we're looking at the end of a statement
	 * Things that end a statement are:
	 *  - Reaching the end of the input
	 *  - Looking at a new line
	 *  - Looking at a closing brace
	 */
	public get isAtEndOfStatement(): boolean {
		return (
			this.isAtEnd ||
			this.peek.type === TokenType.Line ||
			this.peek.type === TokenType.BraceClose
		);
	}

	/** Advances to the next token and returns the previous token */
	public advance(): TokenLike {
		this.skip();
		while (this._token.type === TokenType.LineContinuation) {
			// Parsing methods shouldn't have to worry about line continuations
			// so we skip them here
			this.skip();
			// Make sure that a newline token follows the line continuation token
			// and gobble it up to prevent statements from getting confused
			if (this.check(TokenType.Line)) {
				this.skip();
			} else {
				this.error(this.peek, "Expected end of line after line continuation");
			}
		}
		return this.previous;
	}

	/**
	 * Returns true if the current token is the specified type of token
	 * @param type Type of the token to match
	 */
	public check(type: TokenType): boolean {
		return this.peek.type === type;
	}

	/**
	 * Matches the specified token if present
	 *
	 * Otherwise, it registers and throws an error with the specified message
	 *
	 * @param type The type of token to match (or an array of token types that
	 * are permissible to match)
	 * @param hint The error message hint if the token couldn't be matched
	 */
	public consume(type: TokenType | TokenType[], hint: string): TokenLike {
		if (Array.isArray(type)) {
			for (const t of type) {
				if (this.check(t)) {
					return this.advance();
				}
			}
		} else if (typeof type === "number") {
			if (this.check(type)) return this.advance();
		}
		throw this.error(this.peek, hint);
	}

	/**
	 * Registers an error
	 * @param token The token where the error occurred
	 * @param hint The error message hint
	 */
	public error(token: TokenLike, hint: string): ParseError {
		hint = prepareHint(hint);
		const message =
			"Syntax error in " +
			this.fileTable[token.fileTableIndex] +
			" at " +
			token.line +
			":" +
			token.column +
			" (" +
			token.pos +
			")" +
			" with text `" +
			JSON.stringify(token.lexeme).slice(1, -1) +
			"`. " +
			prepareHint(hint);
		const error = new ParseError(token, message);
		if (!this.isPanicking) this.errors.push(error);
		this.isPanicking = true;
		return error;
	}

	/** Returns true if any of the specified token types were matched */
	public match(...types: TokenType[]): boolean {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}

	/**
	 * Moves on to the next token no matter what (do not call directly,
	 * only used by advance()
	 */
	public skip(): void {
		this._previous = this._token;
		this._token = this.lexer.read();
	}

	/**
	 * Generates a friendly description for an error token
	 * @param errorToken Token to examine
	 */
	public describeErrorToken(errorToken: ErrorToken): string {
		return describeErrorToken(this.fileTable, errorToken);
	}

	/**
	 * Synchronize the parser by exiting panic mode and skipping to the end of
	 * the current statement
	 */
	public synchronize(): void {
		this.isPanicking = false;
		this.advance();

		while (!this.isAtEnd) {
			switch (this.peek.type) {
				// List synchronization tokens here
				case TokenType.Line:
					this.advance(); // Consume the line
					return;
			}

			this.advance();
		}
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
		// Create a new symbol table scope and push it on the symbol table stack
		const symbolTable = this.symbolTable.addScope();
		this._symbolTables.push(symbolTable);
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
		this._symbolTables.pop();
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
	 * Utility parsing method to match any subsequent lines
	 */
	public eatLines(): void {
		while (!this.isAtEnd && this.peek.type === TokenType.Line) {
			this.match(TokenType.Line);
		}
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
		const parameters: Map<string, string[]> = new Map();
		let numParameters: number = 0;
		this.match(TokenType.ParenOpen);
		if (!this.isAtEnd && this.peek.type !== TokenType.ParenClose) {
			do {
				const paramToken = this.consume(
					TokenType.Id,
					"Expected parameter name"
				);
				this.consume(
					TokenType.Colon,
					"Expected colon for parameter type annotation"
				);
				// Attempt to match one or more parameters
				const paramType = this.typeAnnotation();
				// Store the parameter information in the node
				parameters.set(paramToken.lexeme, paramType);
				numParameters++;
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
			numParameters,
			parameters
		);
		// Register the function name and the action info that it points to
		// This will make compilation of functions simpler since we can look up
		// how many parameters and what kind a function takes when we call it
		this.actionTable.set(name, info);
		// Start parsing the action block
		this.consume(TokenType.BraceOpen, "Expected opening brace of action block");
		// Grab the block of statements inside the function curly braces
		const block = this.block(true);
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
		return new ReturnStatementNode(this.previous, expr);
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
