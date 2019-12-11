import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class ExpressionStatementNode extends Expression {
	constructor(
		token: TokenLike,
		/** Return value, if any */
		public readonly expr: Expression
	) {
		super(token.pos, expr.end);
	}

	public type(ast: AbstractSyntaxTree): Type {
		return this.expr.type(ast);
	}

	public accept(visitor: Visitor): void {
		visitor.visitExpressionStatementNode(this);
	}
}
