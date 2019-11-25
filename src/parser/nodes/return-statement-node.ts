import { Expression, Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Visitor } from "../../language/visitor";

export class ReturnStatementNode extends Statement {
	constructor(
		token: TokenLike,
		/** Return value, if any */
		public readonly expr?: Expression | undefined
	) {
		super(token.pos, expr ? expr.end : token.end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitReturnStatementNode(this);
	}
}
