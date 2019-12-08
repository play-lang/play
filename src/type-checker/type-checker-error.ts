import { SemanticError } from "../language/semantic-error";
import { TokenLike } from "../language/token";
import { TypeInfo, TypeRuleset } from "../language/type-system";

export class TypeCheckerError extends SemanticError {
	constructor(
		/** Token where the error occurred */
		token: TokenLike,
		/** Ruleset for allowed types */
		public readonly ruleset: TypeRuleset,
		/** Encountered type */
		public readonly type: TypeInfo,
		/** Type checker error message */
		message: string
	) {
		super(token, message);
	}
}
