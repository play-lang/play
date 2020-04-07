import { SemanticException } from "src/common/exception";
import { TokenLike } from "src/language/token/token";

export class TypeCheckError extends SemanticException {
	constructor(
		/** Token where the error occurred */
		token: TokenLike,
		/** Type checker error message */
		message: string
	) {
		super(token, message);
	}
}
