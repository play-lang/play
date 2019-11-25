import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class AssignmentExpressionNode extends Expression {
	constructor(
		public readonly assignmentType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(lhs.start, rhs.end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitAssignmentExpressionNode(this);
	}
}
