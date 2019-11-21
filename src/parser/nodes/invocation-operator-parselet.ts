import { Expression } from "../../language/node";
import { Visitor } from "../../language/visitor";
import { ActionReferenceNode } from "./action-reference-node";

export class InvocationExpressionNode extends Expression {
	/** Name of the action to call */
	public get actionName(): string | undefined {
		if (this.lhs instanceof ActionReferenceNode) {
			return this.lhs.actionName;
		}
	}

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
