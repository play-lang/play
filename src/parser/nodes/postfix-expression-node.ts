import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class PostfixExpressionNode extends Expression {
	public readonly operatorType: TokenType;
	public readonly lhs: Expression;

	constructor(operatorType: TokenType, lhs: Expression) {
		super();
		this.operatorType = operatorType;
		this.lhs = lhs;
	}

	public accept(visitor: Visitor): void {
		visitor.visitPostfixExpressionNode(this);
	}
}
