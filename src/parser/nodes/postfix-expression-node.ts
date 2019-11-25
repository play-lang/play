import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class PostfixExpressionNode extends Expression {
	public readonly operatorType: TokenType;
	public readonly lhs: Expression;

	constructor(operator: TokenLike, lhs: Expression) {
		super(lhs.start, operator.end);
		this.operatorType = operator.type;
		this.lhs = lhs;
	}

	public accept(visitor: Visitor): void {
		visitor.visitPostfixExpressionNode(this);
	}
}
