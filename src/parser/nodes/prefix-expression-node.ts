import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class PrefixExpressionNode extends Expression {
	public readonly operatorType: TokenType;
	public readonly rhs: Expression;

	constructor(operator: TokenLike, rhs: Expression) {
		super(operator.pos, rhs.end);
		this.operatorType = operator.type;
		this.rhs = rhs;
	}

	public accept(visitor: Visitor): void {
		visitor.visitPrefixExpressionNode(this);
	}
}
