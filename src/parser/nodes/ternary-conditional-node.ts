import { Visitor } from "../../language/visitor";
import { Expression } from "../../language/node";

export class TernaryConditionalNode extends Expression {
	constructor(
		/** Expression to examine */
		public readonly predicate: Expression,
		/** Expression to evaluate if predicate is true */
		public readonly consequent: Expression,
		/** Expression to evaluate if predicate is false */
		public readonly alternate: Expression
	) {
		super();
	}

	public accept(visitor: Visitor): void {
		visitor.visitTernaryConditionalNode(this);
	}
}
