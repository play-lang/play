import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class BinaryExpressionNode extends Expression {
	constructor(
		public readonly operatorType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(lhs.start, rhs.end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitBinaryExpressionNode(this);
	}
}
