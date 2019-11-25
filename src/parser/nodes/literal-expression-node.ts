import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class LiteralExpressionNode extends Expression {
	/** Literal type */
	public readonly literalType: TokenType;
	/** Literal value */
	public readonly literalValue: string;

	constructor(token: TokenLike) {
		super(token.pos, token.end);
		this.literalType = token.type;
		this.literalValue = token.lexeme;
	}

	public accept(visitor: Visitor): void {
		visitor.visitLiteralExpressionNode(this);
	}
}
