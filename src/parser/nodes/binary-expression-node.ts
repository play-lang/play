import { Visitor } from "../../language/visitor";
import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";

export class BinaryExpressionNode extends Expression {
	constructor(
		public readonly operatorType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super();
	}

	public accept(visitor: Visitor): void {
		visitor.visitBinaryExpressionNode(this);
	}
}
