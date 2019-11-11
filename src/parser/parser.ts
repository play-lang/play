import { TokenLike, ErrorToken } from "../language/token";
import { Lexer } from "../lexer";
import { TokenType } from "../language/token-type";
import { ParseError } from "./parse-error";
import { prepareHint, describeErrorToken } from "../common/format-messages";
import { Statement, Expression } from "../language/node";
import { ProgramNode } from "./nodes/program-node";
import { DeclarationNode } from "./nodes/declaration-node";
import { ValueNode } from "./nodes/value-node";
import SymbolTable from "../language/symbol-table";
import { prefixParselets, infixParselets } from "../language/operator-grammar";
import { InfixParselet } from "./parselet";
import { BlockStatementNode } from "./nodes/block-statement-node";

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
	protected _symbolTablePtr: SymbolTable[] = [];

	/** Active symbol table for the current scope */
	protected get symbolTable(): SymbolTable {
		return this._symbolTablePtr[this._symbolTablePtr.length - 1];
	}

	constructor(
		filename: string,
		contents: string,
		fileProvider: (path: string) => Promise<string> = async () => ""
	) {
		this.fileTable.push(filename);
		this.fileProvider = fileProvider;
		this.lexer = new Lexer(contents, 0);
		this._symbolTablePtr.push(new SymbolTable("global"));
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
			if (this.symbolTable.identifierInScope(this.peek.lexeme)) {
				// Identifier has been previously declared
				// Since it's the first thing in the statement this indicates
				// an expression production
				return this.expression();
			} else {
				// An identifier that we have no knowledge of
				// This indicates a declaration production (the start of a type
				// annotation, technically)
				return this.declaration();
			}
		} else if (
			this.peek.type === TokenType.Num ||
			this.peek.type === TokenType.Str ||
			this.peek.type === TokenType.Bool
		) {
			// A token for a primitive type at the start of a statement
			// indicates a variable declaration production
			return this.declaration();
		} else if (this.peek.type === TokenType.BraceOpen) {
			// Match a block statement
			return this.block();
		} else {
			// An unrecognized statement must be an expression statement
			return this.declaration();
		}
	}

	public block(): BlockStatementNode {
		const statements: Statement[] = [];
		this.consume(TokenType.BraceOpen, "Expect opening brace for block");
		while (!this.isAtEnd && this.peek.type !== TokenType.BraceClose) {
			statements.push(this.statement());
		}
		return new BlockStatementNode(statements);
	}

	/**
	 * Parse a variable declaration
	 * Example: num list numbers = [1, 2, 3]
	 *
	 * @param leadingType First identifier already matched--must be the
	 * deepest type in the expression (a num, str, or user-defined type)
	 */
	public declaration(): DeclarationNode {
		const typeAnnotation: string[] = [];
		if (this.match(TokenType.Id, TokenType.Str, TokenType.Num)) {
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
		const nameToken = this.consume(
			TokenType.Id,
			"Expected variable name following declaration"
		);
		// Register the declared variable in the symbol table
		this.symbolTable.register(nameToken, typeAnnotation);
		// Variable declarations must be followed by an = sign
		this.consume(TokenType.Equal, "Expected equal sign following declaration");
		const expr = this.expression();
		return new DeclarationNode(nameToken.lexeme, typeAnnotation, expr);
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

	public value(): ValueNode {
		if (this.peek.type === TokenType.Id) {
			// Match a variable value
			const variableName = this.peek.lexeme;
			if (!this.symbolTable.identifierInScope(variableName)) {
				throw this.error(this.peek, "Undeclared variable");
			}
			this.advance();
			// return new Expression;
		}
		// Todo: make this accept more than just number and string literals
		if (this.match(TokenType.Number, TokenType.String)) {
			const typeAnnotation: string[] =
				this.previous.type === TokenType.Number ? ["num"] : ["str"];
			return new ValueNode(this.previous.lexeme, typeAnnotation);
		}
		throw this.error(this.peek, "Expected literal");
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
