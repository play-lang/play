import { Exception } from "src/common/exception";
import { TokenLike } from "src/language/token/token";

export class SemanticError extends Exception {
	constructor(
		/** Token where the error occurred */
		public readonly token: TokenLike,
		/** Semantic error message */
		public readonly message: string
	) {
		super(message);
	}
}
