import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Type, Void } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class ExpressionStatementNode extends Expression {
	constructor(
		token: TokenLike,
		/** Return value, if any */
		public readonly expr: Expression
	) {
		super(token.pos, expr.end);
	}

	public type(): Type {
		// Expression results from expression statements are unused
		return Void;
	}

	public accept(visitor: Visitor): void {
		visitor.visitExpressionStatementNode?.(this);
	}
}
