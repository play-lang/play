import { TokenLike, Describable } from "../language/token";
import { Exception } from "../common/exception";

export class ParseError extends Exception implements Describable {
	/** Error token */
	public token: TokenLike;

	constructor(token: TokenLike, message: string) {
		super(message);
		this.token = token;
	}

	/** Formatted syntax error description */
	public get description(): string {
		return this.message;
	}
}
