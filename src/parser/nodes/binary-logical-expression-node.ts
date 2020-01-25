import { Expression, Node } from "src/language/node";
import { TokenLike } from "src/language/token";
import { TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import { Bool, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class BinaryLogicalExpressionNode extends Expression {
	constructor(
		token: TokenLike,
		public readonly operatorType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(token, lhs.start, rhs.end);
	}

	public setParent(node: Node | undefined): void {
		this.parent = node;
		this.lhs.setParent(this);
		this.rhs.setParent(this);
	}

	public type(env: Environment): Type {
		// Logical operators simply return booleans, no matter what
		return Bool;
	}

	public accept(visitor: Visitor): void {
		visitor.visitBinaryLogicalExpressionNode?.(this);
	}
}
