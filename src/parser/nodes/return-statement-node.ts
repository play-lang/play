import { Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Visitor } from "../../language/visitor";

export class ReturnStatementNode extends Statement {
	constructor(token: TokenLike) {
		super(token.pos, token.end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitReturnStatementNode(this);
	}
}
