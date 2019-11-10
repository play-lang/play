import { Expression } from "../../language/node";
import { Parser } from "../parser";
import { TokenLike } from "../../language/token";
import { PrefixExpressionNode } from "../nodes/prefix-expression-node";
import { LiteralExpressionNode } from "../nodes/literal-expression-node";
import { BinaryExpressionNode } from "../nodes/binary-expression-node";
import { TokenType } from "../../language/token-type";
import { Precedence } from "../../language/precedence";
import { TernaryConditionalNode } from "../nodes/ternary-conditional-node";
import { AssignmentExpressionNode } from "../nodes/assignment-expression-node";

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

export class GroupParselet implements PrefixParselet {
	public parse(parser: Parser, token: TokenLike): Expression {
		const expression = parser.expression();
		parser.consume(TokenType.ParenClose, "Expected close parenthesis");
		return expression;
	}
}

export class TernaryConditionalParselet implements InfixParselet {
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
		const predicate = lhs;
		const consequent = parser.expression(this.precedence);
		parser.consume(
			TokenType.Colon,
			"Expected colon after conditional operator"
		);
		const alternate = parser.expression(this.precedence - 1);
		return new TernaryConditionalNode(predicate, consequent, alternate);
	}
	public get precedence(): number {
		return Precedence.Conditional;
	}
}

export class AssignmentParselet implements InfixParselet {
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
		// Make sure that the left-hand side is a valid lvalue:
		//
		// if (!lhs.isAddressable) {
		// 	throw parser.error(
		// 		token,
		// 		"Left-hand side of an expression must be addressable"
		// 	);
		// }
		//
		// Assignment is right-associative, so we drop precedence by 1:
		const rhs: Expression = parser.expression(this.precedence - 1);
		return new AssignmentExpressionNode(token.type, lhs, rhs);
	}
	public get precedence(): number {
		return Precedence.Assignment;
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
