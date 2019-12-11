import { Expression } from "../../language/node";
import { Visitor } from "../../language/visitor";
import { FunctionReferenceNode } from "./function-reference-node";

export class InvocationExpressionNode extends Expression {
	/** Name of the function to call */
	public get functionName(): string | undefined {
		if (this.lhs instanceof FunctionReferenceNode) {
			return this.lhs.functionName;
		}
	}

	constructor(
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Left hand side expression preceding this call */
		public readonly lhs: Expression,
		/** Function call invocation argument expressions */
		public readonly args: Expression[]
	) {
		super(start, end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitInvocationExpressionNode(this);
	}
}
