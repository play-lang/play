import { AvlTree } from "./common/avl-tree";
import { prepareHint } from "./common/format-messages";
import {
	isDigit,
	isValidIdChar,
	isValidIdStart,
	isWhitespace,
} from "./language/character-mappings";
import { lexerTrie } from "./language/lexer-trie";
import { SourceFile } from "./language/source-file";
import { stringEscapes } from "./language/string-escapes";
import { ErrorToken, Position, Token, TokenLike } from "./language/token";
import { idTokenTypes, TokenType } from "./language/token-type";

export class Lexer {
	/**
	 * Non-failing errors encountered while scanning for a token
	 *
	 * The contents of this are reset after each scan()
	 */
	public warnings: ErrorToken[] = [];
	/**
	 * File that the lexer is scanning
	 */
	public readonly file: SourceFile;

	/** True if the source has reached the end */
	public get isAtEnd(): boolean {
		return this.head.pos >= this.contents.length;
	}

	/** Next character (first look ahead) */
	public get peek(): string {
		return this.head.pos < this.contents.length
			? this.contents[this.head.pos]
			: "";
	}

	/**
	 * Current "value" of the lexer, as measured between the lexer's start
	 * position and current position
	 */
	public get lexeme(): string {
		return this.contents.substring(this.tail.pos, this.head.pos);
	}

	/**
	 * Length of the current "value" of the lexer, as measured between the
	 * lexer's start position and current position
	 */
	public get length(): number {
		return this.head.pos - this.tail.pos;
	}

	/**
	 * Current lexer token
	 *
	 * Note: use this to read the first token when the lexer starts as opposed to
	 * calling read() or you will skip the first token
	 */
	public get token(): TokenLike {
		return this._token;
	}

	/** Current lexer lookahead token */
	public get lookahead(): TokenLike {
		return this._lookahead;
	}

	/** Number of tokens scanned */
	public get numTokens(): number {
		return this._numTokens;
	}

	/**
	 * Current file based on the lexer's position
	 *
	 * Normally, this is the file given to the lexer, but if a preprocessed
	 * file is provided to the lexer representing a composite file from the
	 * preprocessor output then the ranges will be examined...
	 *
	 * Ranges are resolved by examining the lexer's current position and matching
	 * it against the range tree to see which file the lexer is currently scanning
	 */
	public get currentFile(): SourceFile {
		if (!this.ranges) {
			return this.file;
		}
		const bound = this.ranges.findLowerBound(this.tail.pos);
		if (bound === null) {
			throw new Error(
				"Cannot find range tree bound for index " + this.tail.pos
			);
		}
		return this.ranges.get(bound)!;
	}

	/** Current token */
	protected _token: TokenLike;

	/** Look-ahead token */
	protected _lookahead: TokenLike;

	/** Head position of the lexer (start of token) */
	protected head: Position = {
		pos: 0,
		line: 1,
		column: 0,
	};

	/** Tail position of the lexer (end of token) */
	protected tail: Position = {
		pos: 0,
		line: 1,
		column: 0,
	};

	/** Number of tokens read */
	protected _numTokens: number = 0;

	/**
	 * Create a lexer for a given file and its contents
	 * @param contents Contents of the entire file as a string
	 * @param [file] Source file the lexer is scanning
	 * @param [ranges] Range tree that maps text range positions to source files
	 * If this parameter is given, the lexer assumes it is scanning a composite
	 * file that represents multiple files chained together
	 */
	constructor(
		/** Lexer contents to scan */
		public readonly contents: string,
		file?: SourceFile,
		public readonly ranges?: AvlTree<number, SourceFile>
	) {
		this.file = file || new SourceFile("source");
		// Read the first tokens
		this._token = this.scan();
		this._lookahead = this.scan();
	}

	/**
	 * Returns true if the specified token is considered a trivial token
	 * (whitespace, comments, etc)
	 * @param token The token to analyze
	 */
	public isTrivia(token: TokenLike): boolean {
		return (
			token.type === TokenType.Whitespace ||
			token.type === TokenType.Comment ||
			token.type === TokenType.CommentBlock
		);
	}

	/**
	 * Scan the entire contents and generate a list of tokens
	 */
	public readAll(): TokenLike[] {
		const tokens: TokenLike[] = [];

		if (this.lookahead.type === TokenType.EndOfFile) return [this.token];

		do {
			tokens.push(this._token);
			this.read();
		} while (this._token.type !== TokenType.EndOfFile);

		tokens.push(this._token);

		return tokens;
	}

	/**
	 * Scans and reads the next token, returning it
	 *
	 * If the end of the input has been reached, this returns the EndOfFile
	 * token
	 */
	public read(): TokenLike {
		this._token = this._lookahead;
		this._lookahead = this.scan();
		this.coalesceErrorTokens();
		return this._token;
	}

	/** True if the specified character is whitespace */
	public isWhitespace(char: string): boolean {
		if (!char) return false;
		const codePoint = char.codePointAt(0)!;
		return isWhitespace(codePoint);
	}

	/** True if the specified character is a new-line feed */
	public isLine(char: string): boolean {
		return char === "\n" || char === "\r";
	}

	/**
	 * If the next character matches the expected string this will advance
	 * the lexer position
	 */
	protected match(expected: string): boolean {
		return this.isAtEnd || this.peek !== expected ? false : !!this.advance();
	}

	/** Returns the current character and advances the lexer position */
	protected advance(): string {
		if (this.peek === "\n") {
			this.head.line++;
			this.head.column = 0;
		} else {
			this.head.column++;
		}
		return this.contents[this.head.pos++];
	}

	/**
	 * Creates an error token at the current lexer position
	 *
	 * @param [hint] Short error description that does not reference the offending
	 * character(s), i.e., "Invalid character" or "Unclosed string"
	 */
	protected error(hint: string): ErrorToken {
		// Make sure hint ends in punctuation to aid in formatting later.
		hint = prepareHint(hint);
		return new ErrorToken({
			lexeme: this.lexeme,
			length: this.length,
			pos: this.tail.pos,
			end: this.tail.pos + this.length,
			line: this.tail.line,
			column: this.tail.column,
			type: TokenType.Error,
			hints: new Set<string>([hint]),
			file: this.currentFile,
		});
	}

	/**
	 * Issues a warning about the current character while scanning
	 *
	 * @param hint The warning description
	 */
	protected warn(hint: string): void {
		hint = prepareHint(hint);
		this.warnings.push(
			new ErrorToken({
				lexeme: this.peek,
				length: 1,
				pos: this.head.pos,
				end: this.tail.pos + this.length,
				line: this.head.line,
				column: this.head.column,
				type: TokenType.Error,
				hints: new Set<string>([hint]),
				file: this.currentFile,
			})
		);
	}

	/**
	 * Scan the source of the associated file and return the next token
	 *
	 * Error tokens should be returned and handled by the parser for
	 * graceful error-reporting to the end user
	 *
	 */
	protected scan(): TokenLike {
		this.tail = { ...this.head };

		// Trivia consists of junk tokens like whitespace, comments, and
		// comment blocks that precede a useful token
		const trivia = [];

		let token = this.scanNextToken();
		// Keep a list of all the consecutive trivia tokens we find
		// We will give the next non-trivial token we find the list of all the
		// trivia that precedes it.
		while (this.isTrivia(token)) {
			trivia.push(token);
			this.tail = { ...this.head };
			token = this.scanNextToken();
		}
		token.trivia = trivia;
		return token;
	}

	/**
	 * Join the next and lookahead tokens together if they are both only one
	 * character long and on the same line
	 *
	 * Joining adjacent error tokens together creates a much better error
	 * reporting experience for the end user
	 */
	protected coalesceErrorTokens(): void {
		while (
			this._token instanceof ErrorToken &&
			this._lookahead instanceof ErrorToken &&
			// this._token.length === 1 &&
			// this._lookahead.length === 1 &&
			this._token.line === this._lookahead.line
		) {
			// Join these two tokens
			this._token = this.joinTokens(this._token, this._lookahead);
			this._lookahead = this.scan();
		}
	}

	/**
	 * Joins two adjacent tokens together to form one longer token
	 * @param first The first token (that immediately precedes the second token)
	 * @param second The following token
	 */
	protected joinTokens(first: ErrorToken, second: ErrorToken): ErrorToken {
		const combinedHints = new Set<string>();
		first.hints.forEach(hint => combinedHints.add(hint));
		second.hints.forEach(hint => combinedHints.add(hint));
		return new ErrorToken({
			pos: first.pos,
			end: second.end,
			line: first.line,
			column: first.column,
			lexeme: String(first.lexeme) + String(second.lexeme),
			length: first.length + second.length,
			type: Number.NaN,
			hints: combinedHints,
			file: first.file,
		});
	}

	protected makeToken(type: number, lexeme?: string): TokenLike {
		return new Token({
			file: this.currentFile,
			lexeme: typeof lexeme === "undefined" ? this.lexeme : lexeme,
			length: this.length,
			pos: this.tail.pos,
			end: this.tail.pos + this.length,
			line: this.tail.line,
			column: this.tail.column,
			type,
		});
	}

	private scanNextToken(): TokenLike {
		if (this.isAtEnd) {
			return this.makeToken(TokenType.EndOfFile);
		}

		++this._numTokens;

		let char = this.advance();

		// Examine each initial character to determine which lexer
		// subroutine to use to finish scanning the token
		if (this.isWhitespace(char)) return this.whitespace();
		else if (this.isLine(char)) return this.linefeed();
		else if (char === "/" && (this.peek === "/" || this.peek === "*")) {
			return this.comment();
		} else if (char === "_" && !this.isValidIdStart(this.peek)) {
			// Line extender must not be part of an identifer
			return this.makeToken(TokenType.LineContinuation);
		} else if (this.isDigit(char)) return this.number();
		else if (char === '"') return this.string();
		else if (this.isValidIdStart(char)) return this.id();
		else if (char in lexerTrie) {
			// Use a trie tree to check for potentially multi-character symbols
			// like + and ++, as well as many simple one-character symbols
			let triePointer = lexerTrie[char];
			while (triePointer.next && this.peek in triePointer.next) {
				char = this.advance();
				triePointer = triePointer.next[char];
			}
			return this.makeToken(triePointer.type);
		}

		return this.error("Unrecognized token");
	}

	private whitespace(): TokenLike {
		while (this.isWhitespace(this.peek)) this.advance();
		return this.makeToken(TokenType.Whitespace);
	}

	private linefeed(): TokenLike {
		while (this.isLine(this.peek)) this.advance();
		return this.makeToken(TokenType.Line);
	}

	private comment(): TokenLike {
		if (this.match("/")) {
			// Single line comment
			while (this.peek && this.peek !== "\n" && this.peek !== "\r") {
				this.advance();
			}
			return this.makeToken(TokenType.Comment);
		}
		// This function won't get called unless the look ahead was another
		// slash or star, so we can safely do this:
		this.match("*");
		// Block comment
		while (this.peek) {
			if (this.peek === "*") {
				this.match("*");
				if (this.match("/")) {
					return this.makeToken(TokenType.CommentBlock);
				}
			}
			this.advance();
		}
		return this.error("Unclosed block comment");
	}

	private id(): TokenLike {
		while (isValidIdChar(this.peek.codePointAt(0)!)) {
			this.advance();
		}
		// Look the id up in the reserved id tables for the language to
		// see if it represents built-in functionality
		const tokenType =
			this.lexeme in idTokenTypes ? idTokenTypes[this.lexeme] : TokenType.Id;
		return this.makeToken(tokenType);
	}

	private number(): TokenLike {
		while (!this.isAtEnd && this.isDigit(this.peek)) this.advance();
		if (this.match(".")) {
			// Decimal portion
			if (!this.isDigit(this.peek)) {
				return this.error("Decimal number is missing");
			}
			while (this.isDigit(this.peek)) this.advance();
		}
		if (this.match("e") || this.match("E")) {
			// Exponent portion
			this.match("+") || this.match("-"); // Match an exponent sign
			if (!this.isDigit(this.peek)) {
				return this.error("Exponent not followed by a number");
			}
			while (this.isDigit(this.peek)) this.advance();
		}
		return this.makeToken(TokenType.Number);
	}

	private string(): TokenLike {
		let lexeme = "";
		while (!this.isAtEnd && !this.isLine(this.peek) && this.peek !== '"') {
			if (this.match("\\")) {
				if (this.peek in stringEscapes) {
					// Escape sequence
					lexeme += String.fromCharCode(stringEscapes[this.advance()]);
				} else {
					lexeme += this.advance();
					this.warn("Unknown escape sequence");
				}
			} else lexeme += this.advance();
		}
		if (this.match('"')) return this.makeToken(TokenType.String, lexeme);
		return this.error("Unclosed string");
	}

	/** True if the specified character can start an identifier token */
	private isValidIdStart(char: string): boolean {
		return isValidIdStart(char.codePointAt(0)!);
	}

	/** True if the specified character is a digit */
	private isDigit(char: string): boolean {
		const cp = char.codePointAt(0);
		if (!cp) return false;
		return isDigit(cp);
	}
}
