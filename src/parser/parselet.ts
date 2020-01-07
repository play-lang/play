import { Expression } from "../language/node";
import { Precedence } from "../language/precedence";
import { TokenLike } from "../language/token";
import { TokenType } from "../language/token-type";
import { AssignmentExpressionNode } from "./nodes/assignment-expression-node";
import { BinaryExpressionNode } from "./nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "./nodes/binary-logical-expression-node";
import { IdExpressionNode } from "./nodes/id-expression-node";
import { InvocationExpressionNode } from "./nodes/invocation-expression-node";
import { PostfixExpressionNode } from "./nodes/postfix-expression-node";
import { PrefixExpressionNode } from "./nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "./nodes/primitive-expression-node";
import { TernaryConditionalNode } from "./nodes/ternary-conditional-node";
import { Parser } from "./parser";

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
		return new PrefixExpressionNode(token, operand);
	}
}

export class PrimitiveParselet implements PrefixParselet {
	public parse(parser: Parser, token: TokenLike): Expression {
		return new PrimitiveExpressionNode(token);
	}
}

export class IdParselet implements PrefixParselet {
	public parse(parser: Parser, token: TokenLike): Expression {
		return new IdExpressionNode(token);
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
	public parse(
		parser: Parser,
		lhs: Expression,
		token: TokenLike
	): Expression {
		const predicate = lhs;
		// Since ternary is right associative, we must subtract one from precedence
		const consequent = parser.expression(this.precedence - 1);
		parser.consume(
			TokenType.Colon,
			"Expected colon after conditional operator"
		);
		const alternate = parser.expression(this.precedence - 1);
		return new TernaryConditionalNode(
			token,
			predicate,
			consequent,
			alternate
		);
	}
	public get precedence(): number {
		return Precedence.Conditional;
	}
}

export class AssignmentParselet implements InfixParselet {
	public parse(
		parser: Parser,
		lhs: Expression,
		token: TokenLike
	): Expression {
		// Assignment is right-associative, so we drop precedence by 1:
		const rhs: Expression = parser.expression(this.precedence - 1);
		return new AssignmentExpressionNode(token, token.type, lhs, rhs);
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
	public parse(
		parser: Parser,
		lhs: Expression,
		token: TokenLike
	): Expression {
		// We drop the precedence slightly for right associative operators
		// so that another right associative operator will bind more tightly
		const rhs: Expression = parser.expression(
			this.precedence - (this.isRightAssociative ? 1 : 0)
		);
		return new BinaryExpressionNode(token, token.type, lhs, rhs);
	}
}

export class BinaryLogicalOperatorParselet implements InfixParselet {
	constructor(public readonly precedence: number) {}
	public parse(
		parser: Parser,
		lhs: Expression,
		token: TokenLike
	): Expression {
		// We drop the precedence slightly for right associative operators
		// so that another right associative operator will bind more tightly
		const rhs: Expression = parser.expression(this.precedence);
		return new BinaryLogicalExpressionNode(token, token.type, lhs, rhs);
	}
}

export class PostfixOperatorParselet implements InfixParselet {
	public parse(
		parser: Parser,
		lhs: Expression,
		token: TokenLike
	): Expression {
		return new PostfixExpressionNode(token, lhs);
	}
	public get precedence(): number {
		return Precedence.Primary;
	}
}

export class InvocationOperatorParselet implements InfixParselet {
	public parse(
		parser: Parser,
		lhs: Expression,
		token: TokenLike
	): Expression {
		if (lhs instanceof IdExpressionNode) {
			lhs.usedAsFunction = true;
		}
		const args: Expression[] = [];
		let end: number = token.end;
		if (!parser.match(TokenType.ParenClose)) {
			do {
				args.push(parser.expression());
			} while (parser.match(TokenType.Comma));
			parser.consume(
				TokenType.ParenClose,
				"Expected closing parenthesis following function arguments"
			);
			end = parser.previous.end;
		}
		return new InvocationExpressionNode(token, lhs.start, end, lhs, args);
	}
	public get precedence(): number {
		return Precedence.Primary;
	}
}
