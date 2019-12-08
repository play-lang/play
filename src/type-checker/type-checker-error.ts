import { SemanticError } from "../language/semantic-error";
import { TokenLike } from "../language/token";

export class TypeCheckerError extends SemanticError {
	constructor(
		/** Token where the error occurred */
		token: TokenLike,
		/** Expected type */
		public readonly expectedType: string[],
		/** Encountered type */
		public readonly encounteredType: string[],
		/** Type checker error message */
		message: string
	) {
		super(token, message);
	}
}
