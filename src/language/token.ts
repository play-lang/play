import { describeErrorToken } from "../common/format-messages";
import { TokenType } from "./token-type";

export interface Position {
	pos: number;
	line: number;
	column: number;
}

export interface Describable {
	description: string;
}

export interface TokenLike extends Describable {
	/**
	 * Filename index that the token originates from
	 *
	 * The lexer keeps an array of filenames when it combines files together for
	 * preprocessing and this is an index into that array
	 */
	readonly fileTableIndex: number;

	/** Token type (must be a number from an integer enum) */
	readonly type: number;

	/** Starting position of the token in the file */
	readonly pos: number;

	/** Physical line number the start of the token was found on in the file */
	readonly line: number;

	/**
	 * End position index into the source immediately after the token
	 *
	 * Represents the next index in the source that is not part of the token
	 */
	readonly end: number;

	/** Column position on the line of the the start position of the token */
	readonly column: number;

	/**
	 * Length of the token in the buffer (not necessarily the length of
	 * the lexeme).
	 */
	readonly length: number;

	/**
	 * The token lexeme--the value that it represents if it is an
	 * identifier or literal token, otherwise the raw text of the token.
	 */
	readonly lexeme: string;

	/**
	 * Decorative tokens that may have preceded this one
	 * (such as comments and whitespace)
	 */
	trivia: TokenLike[];
}

export class Token implements TokenLike, Position, Describable {
	public readonly fileTableIndex: number;
	public readonly type: number;
	public readonly pos: number;
	public readonly line: number;
	public readonly column: number;
	public readonly length: number;
	public readonly lexeme: string;
	public trivia: TokenLike[] = [];

	constructor(options: Omit<TokenLike, "description" | "trivia">) {
		this.fileTableIndex = options.fileTableIndex;
		this.type = options.type;
		this.pos = options.pos;
		this.line = options.line;
		this.column = options.column;
		this.length = options.length;
		this.lexeme = options.lexeme;
	}

	public get end(): number {
		return this.pos + this.length;
	}

	// MARK: Describable

	public get description(): string {
		const type = TokenType[this.type];
		const display = JSON.stringify(this.lexeme).slice(1, -1);
		return type + "(`" + display + "`)";
	}
}

export class ErrorToken extends Token {
	/** Error hints */
	public readonly hints: Set<string>;

	/** Reference to the file table being used for this token */
	public readonly fileTable: string[];

	constructor(
		options: Omit<TokenLike, "description" | "trivia"> & {
			hints: Set<string>;
			fileTable: string[];
		}
	) {
		super(options);
		this.hints = options.hints;
		this.fileTable = options.fileTable;
	}

	public get description(): string {
		return (
			this.constructor.name +
			"(`" +
			describeErrorToken(this.fileTable, this) +
			"`)"
		);
	}
}
