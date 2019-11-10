import { Visitor } from "../../language/visitor";
import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";

export class AssignmentExpressionNode extends Expression {
	constructor(
		public readonly assignmentType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super();
	}

	public accept(visitor: Visitor): void {
		visitor.visitAssignmentExpressionNode(this);
	}
}
