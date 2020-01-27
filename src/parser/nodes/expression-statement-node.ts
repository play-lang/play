import { Expression, Node, Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { None, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class ExpressionStatementNode extends Statement {
	constructor(
		token: TokenLike,
		/** Return value, if any */
		public readonly expr: Expression
	) {
		super(token, token.pos, expr.end);
	}

	public setParent(node: Node | undefined): void {
		this.parent = node;
		this.expr.setParent(this);
	}

	public type(env: Environment): Type {
		// Expression results from expression statements are unused
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitExpressionStatementNode?.(this);
	}
}
