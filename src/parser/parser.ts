import { describeErrorToken, prepareHint } from "../common/format-messages";
import { Expression, Statement } from "../language/node";
import { infixParselets, prefixParselets } from "../language/operator-grammar";
import SymbolTable from "../language/symbol-table";
import { ErrorToken, TokenLike } from "../language/token";
import { TokenType } from "../language/token-type";
import { Lexer } from "../lexer";
import { ActionDeclarationNode } from "./nodes/action-declaration-node";
import { BlockStatementNode } from "./nodes/block-statement-node";
import { ProgramNode } from "./nodes/program-node";
import { VariableDeclarationNode } from "./nodes/variable-declaration-node";
import { ParseError } from "./parse-error";
import { InfixParselet } from "./parselet";

export class Parser {
	/** List of errors encountered in the code */
	public readonly errors: ParseError[] = [];

	/** Table containing every file encountered */
	public readonly fileTable: string[] = [];

	/** Lexer used to provide tokens as needed */
	public readonly lexer: Lexer;

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

	/**
	 * Context names mapped to action nodes
	 * This allows us to look-up functions by name without having to walk the tree
	 */
	protected actionTable: Map<string, ActionDeclarationNode> = new Map();

	/** Global scope symbol table */
	public get globalScope(): SymbolTable {
		return this._symbolTables[0];
	}

	/** Active symbol table for the current scope */
	protected get symbolTable(): SymbolTable {
		return this._symbolTables[this._symbolTables.length - 1];
	}

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

	public parse(): ProgramNode {
		const statements: Statement[] = [];
		while (!this.isAtEnd) {
			try {
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
		return new ProgramNode(statements);
	}

	public statement(): Statement {
		// See what we're looking at to figure out what kind of statement
		// production to make
		if (this.peek.type === TokenType.Id) {
			// Looking at an identifier
			if (this.symbolTable.idInScope(this.peek.lexeme)) {
				// Identifier has been previously declared
				// Since it's the first thing in the statement this indicates
				// an expression production
				return this.expression();
			} else {
				// An identifier that we have no knowledge of
				// This indicates a declaration production (the start of a type
				// annotation, technically)
				return this.variableDeclaration();
			}
		} else if (
			this.peek.type === TokenType.Num ||
			this.peek.type === TokenType.Str ||
			this.peek.type === TokenType.Bool
		) {
			// A token for a primitive type at the start of a statement
			// indicates a variable declaration production
			return this.variableDeclaration();
		} else if (this.peek.type === TokenType.BraceOpen) {
			// Match a block statement
			return this.block();
		} else if (this.peek.type === TokenType.Action) {
			// Function definition
			return this.actionDeclaration();
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
		this.consume(TokenType.BraceOpen, "Expect opening brace for block");
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
		return new BlockStatementNode(statements, isActionBlock);
	}

	/**
	 * Utility parsing method to parse a type annotation in code and
	 * return it as an array of strings
	 */
	public typeAnnotation(): string[] {
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
			this.peek.type === TokenType.Map
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
		const typeAnnotation = this.typeAnnotation();
		const nameToken = this.consume(
			TokenType.Id,
			"Expected variable name following declaration"
		);
		// Register the declared variable in the symbol table
		this.symbolTable.register(nameToken, typeAnnotation);
		// Variable declarations may be followed by an equals sign to initialize
		// the value, otherwise we initialize the zero-value for it
		if (this.match(TokenType.Equal)) {
			return new VariableDeclarationNode(
				nameToken.lexeme,
				typeAnnotation,
				this.expression()
			);
		}
		return new VariableDeclarationNode(nameToken.lexeme, typeAnnotation);
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
		this.match(TokenType.Action);
		const typeAnnotation = this.typeAnnotation();
		// Todo: register action in global scope
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
		// Create a node
		const node = new ActionDeclarationNode(name, typeAnnotation);
		this.match(TokenType.ParenOpen);
		if (!this.isAtEnd && this.peek.type !== TokenType.ParenClose) {
			do {
				// Attempt to match one or more parameters
				const paramType = this.typeAnnotation();
				const paramToken = this.consume(
					TokenType.Id,
					"Expected parameter name following parameter type annotation"
				);
				// Store the parameter information in the node
				node.parameters.set(paramToken.lexeme, paramType);
				node.numParameters++;
			} while (this.match(TokenType.Comma));
		}
		this.match(TokenType.ParenClose);
		// Register the function name and the AST node that it points to
		// This will make compilation of functions simpler
		this.actionTable.set(name, node);
		// Grab the block of statements inside the function curly braces
		node.block = this.block(true);
		return node;
	}

	public expression(precedence: number = 0): Expression {
		// return this.value();

		let token = this.advance();
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
