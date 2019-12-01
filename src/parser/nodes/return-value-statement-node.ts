import { Expression, Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Visitor } from "../../language/visitor";

export class ReturnValueStatementNode extends Statement {
	constructor(
		token: TokenLike,
		/** Return value, if any */
		public readonly expr: Expression
	) {
		super(token.pos, expr.end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitReturnValueStatementNode(this);
	}
}
