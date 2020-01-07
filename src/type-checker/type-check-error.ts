import { SemanticError } from "src/language/semantic-error";
import { TokenLike } from "src/language/token";

export class TypeCheckError extends SemanticError {
	constructor(
		/** Token where the error occurred */
		token: TokenLike,
		/** Type checker error message */
		message: string
	) {
		super(token, message);
	}
}
