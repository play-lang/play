import { Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Visitor } from "../../language/visitor";

export class ReturnStatementNode extends Statement {
	constructor(token?: TokenLike) {
		super(token ? token.pos : -1, token ? token.end : -1);
	}

	public accept(visitor: Visitor): void {
		visitor.visitReturnStatementNode(this);
	}
}
