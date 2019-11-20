import { Expression } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class InvocationExpressionNode extends Expression {
	constructor(
		/** Left hand side expression preceding this call */
		public readonly lhs: Expression,
		/** Function call invocation argument expressions */
		public readonly args: Expression[]
	) {
		super();
	}

	public accept(visitor: Visitor): void {
		visitor.visitInvocationExpressionNode(this);
	}
}
