import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { TokenType } from "../../language/token-type";
import { Environment } from "../../language/types/environment";
import { constructType, Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class BinaryLogicalExpressionNode extends Expression {
	constructor(
		token: TokenLike,
		public readonly operatorType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(token, lhs.start, rhs.end);
	}

	public type(env: Environment): Type {
		// Logical operators simply return booleans, no matter what
		return constructType(["bool"]);
	}

	public accept(visitor: Visitor): void {
		visitor.visitBinaryLogicalExpressionNode?.(this);
	}
}
