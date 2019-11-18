import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class LiteralExpressionNode extends Expression {
	public readonly token: TokenLike;

	public get type(): TokenType {
		return this.token.type;
	}

	constructor(token: TokenLike) {
		super();
		this.token = token;
	}

	public accept(visitor: Visitor): void {
		visitor.visitLiteralExpressionNode(this);
	}
}
