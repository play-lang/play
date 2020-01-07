import { Exception } from "src/common/exception";
import { TokenLike } from "src/language/token";

export class ParseError extends Exception {
	/** Error token */
	public token: TokenLike;

	constructor(token: TokenLike, message: string) {
		super(message);
		this.token = token;
	}
}
