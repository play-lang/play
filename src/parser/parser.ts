import { TokenLike, ErrorToken } from "../language/token";
import { Lexer } from "../lexer";
import { TokenType } from "../language/token-type";
import { ParseError } from "./parse-error";
import { prepareHint, describeErrorToken } from "../common/format-messages";

export class Parser {
	/** List of errors encountered in the code */
	public readonly errors: ParseError[] = [];

	/** Table containing every file encountered */
	public readonly fileTable: string[] = [];

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
	/** Lexer used to provide tokens as needed */
	protected lexer: Lexer;

	/** Current token */
	protected _token: TokenLike;
	/** Previous token */
	protected _previous: TokenLike;

	constructor(
		filename: string,
		contents: string,
		fileProvider: (path: string) => Promise<string> = async () => ""
	) {
		this.fileTable.push(filename);
		this.fileProvider = fileProvider;
		this.lexer = new Lexer(contents, 0);
		this._token = this.lexer.read();
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
	 * @param type The type of token to match
	 * @param hint The error message hint if the token couldn't be matched
	 */
	public consume(type: TokenType, hint: string): TokenLike {
		if (this.check(type)) return this.advance();
		throw this.error(this.peek, hint);
	}

	/**
	 * Registers an error
	 * @param token The token where the error occurred
	 * @param hint The error message hint
	 */
	protected error(token: TokenLike, hint: string): ParseError {
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
	protected match(...types: TokenType[]): boolean {
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
	protected skip(): void {
		this._previous = this._token;
		this._token = this.lexer.read();
	}

	/**
	 * Generates a friendly description for an error token
	 * @param errorToken Token to examine
	 */
	protected describeErrorToken(errorToken: ErrorToken): string {
		return describeErrorToken(this.fileTable, errorToken);
	}
}
