import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class PrefixExpressionNode extends Expression {
	public readonly operatorType: TokenType;
	public readonly rhs: Expression;

	constructor(operatorType: TokenType, rhs: Expression) {
		super();
		this.operatorType = operatorType;
		this.rhs = rhs;
	}

	public accept(visitor: Visitor): void {
		visitor.visitPrefixExpressionNode(this);
	}
}
