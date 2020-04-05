import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token/token";
import { Environment } from "src/language/types/environment";
import { Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

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

	public setState(state: NodeState): void {
		this.state = state;
		this.predicate.setState({ ...state, parent: this });
		this.consequent.setState({ ...state, parent: this });
		this.alternate.setState({ ...state, parent: this });
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
