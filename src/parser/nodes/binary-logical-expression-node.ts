import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";
import { constructType, Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class BinaryLogicalExpressionNode extends Expression {
	constructor(
		public readonly operatorType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(lhs.start, rhs.end);
	}

	public type(): Type {
		// Logical operators simply return booleans, no matter what
		return constructType(["bool"]);
	}

	public accept(visitor: Visitor): void {
		visitor.visitBinaryLogicalExpressionNode?.(this);
	}
}
