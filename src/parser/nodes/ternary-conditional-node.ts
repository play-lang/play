import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Environment } from "../../language/types/environment";
import { Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class TernaryConditionalNode extends Expression {
	constructor(
		token: TokenLike,
		/** Expression to examine */
		public readonly predicate: Expression,
		/** Expression to evaluate if predicate is true */
		public readonly consequent: Expression,
		/** Expression to evaluate if predicate is false */
		public readonly alternate: Expression
	) {
		super(token, predicate.start, alternate.end);
	}

	public type(env: Environment): Type {
		// Ternary conditionals must return the same type of things regardless of
		// predicate's outcome
		// The alternate must have the same type as the consequent
		return this.consequent.type(env);
	}

	public accept(visitor: Visitor): void {
		visitor.visitTernaryConditionalNode?.(this);
	}
}
