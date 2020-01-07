import { prepareHint } from "src/common/format-messages";
import { TokenLike } from "src/language/token";
import { TokenType } from "src/language/token-type";
import { Lexer } from "src/lexer/lexer";
import { ParseError } from "src/parser/parse-error";

/**
 * Basic parsing and error handling functionality is provided in this class
 * and extended by both the pre-processor and the parser
 */
export class TokenParser {
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

	/** List of errors encountered in the code */
	public readonly errors: ParseError[] = [];

	/** True if the parser is in panic mode */
	public isPanicking: boolean = false;

	/** Current token */
	protected _token: TokenLike;

	/** Previous token */
	protected _previous: TokenLike;

	constructor(
		/** Lexer used to provide tokens as needed */
		public readonly lexer: Lexer
	) {
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
				this.error(
					this.peek,
					"Expected end of line after line continuation"
				);
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
	 * Consume the end of a statement
	 * This will match the end of the file or a new line character
	 * @param hint An optional hint
	 */
	public consumeEndOfStatement(
		hint: string = "Expected end of statement"
	): void {
		this.consume([TokenType.Line, TokenType.EndOfFile], hint);
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
			token.file.name +
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
	 * Utility parsing method to match any subsequent lines
	 */
	public eatLines(): void {
		while (!this.isAtEnd && this.peek.type === TokenType.Line) {
			this.match(TokenType.Line);
		}
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
				case TokenType.BraceOpen:
				case TokenType.BraceClose:
				case TokenType.Line:
					this.advance(); // Consume the line
					return;
			}

			this.advance();
		}
	}
}
