import { Exception } from "../common/exception";
import { TokenLike } from "../language/token";

export class ParseError extends Exception {
	/** Error token */
	public token: TokenLike;

	constructor(token: TokenLike, message: string) {
		super(message);
		this.token = token;
	}
}
