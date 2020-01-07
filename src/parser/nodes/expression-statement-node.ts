import { Expression } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { Type, Void } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class ExpressionStatementNode extends Expression {
	constructor(
		token: TokenLike,
		/** Return value, if any */
		public readonly expr: Expression
	) {
		super(token, token.pos, expr.end);
	}

	public type(env: Environment): Type {
		// Expression results from expression statements are unused
		return Void;
	}

	public accept(visitor: Visitor): void {
		visitor.visitExpressionStatementNode?.(this);
	}
}
