import { Expression } from "../../language/node";
import { Parser } from "../parser";
import { TokenLike } from "../../language/token";
import { PrefixExpressionNode } from "../nodes/prefix-expression-node";
import { LiteralExpressionNode } from "../nodes/literal-expression-node";
import { BinaryExpressionNode } from "../nodes/binary-expression-node";

export interface PrefixParselet {
	parse(parser: Parser, token: TokenLike): Expression;
}

export interface InfixParselet {
	readonly precedence: number;
	parse(parser: Parser, lhs: Expression, token: TokenLike): Expression;
}

export class PrefixOperatorParselet implements PrefixParselet {
	constructor(public readonly precedence: number) {}
	public parse(parser: Parser, token: TokenLike): Expression {
		const operand: Expression = parser.expression(this.precedence);
		return new PrefixExpressionNode(token.type, operand);
	}
}

export class LiteralParselet implements PrefixParselet {
	public parse(parser: Parser, token: TokenLike): Expression {
		return new LiteralExpressionNode(token);
	}
}

export class BinaryOperatorParselet implements InfixParselet {
	constructor(
		public readonly precedence: number,
		public readonly isRightAssociative: boolean
	) {}
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
		// We drop the precedence slightly for right associative operators
		// so that another right associative operator will bind more tightly
		const rhs: Expression = parser.expression(
			this.precedence - (this.isRightAssociative ? 1 : 0)
		);
		return new BinaryExpressionNode(token.type, lhs, rhs);
	}
}
