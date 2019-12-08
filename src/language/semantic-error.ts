import { Exception } from "../common/exception";
import { TokenLike } from "../language/token";

export class SemanticError extends Exception {
	constructor(
		/** Token where the error occurred */
		public readonly token: TokenLike,
		/** Semantic error message */
		message: string
	) {
		super(message);
	}
}
