import { SemanticError } from "../language/semantic-error";
import { TokenLike } from "../language/token";

export class TypeCheckerError extends SemanticError {
	constructor(
		/** Token where the error occurred */
		token: TokenLike,
		/** Type checker error message */
		message: string
	) {
		super(token, message);
	}
}
