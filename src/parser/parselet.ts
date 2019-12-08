import { Expression } from "../language/node";
import { Precedence } from "../language/precedence";
import { TokenLike } from "../language/token";
import { TokenType } from "../language/token-type";
import { ActionReferenceNode } from "./nodes/action-reference-node";
import { AssignmentExpressionNode } from "./nodes/assignment-expression-node";
import { BinaryExpressionNode } from "./nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "./nodes/binary-logical-expression-node";
import { InvocationExpressionNode } from "./nodes/invocation-operator-parselet";
import { PostfixExpressionNode } from "./nodes/postfix-expression-node";
import { PrefixExpressionNode } from "./nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "./nodes/primitive-expression-node";
import { TernaryConditionalNode } from "./nodes/ternary-conditional-node";
import { VariableReferenceNode } from "./nodes/variable-reference-node";
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
		const scope = parser.symbolTable.idInScope(token.lexeme);
		if (scope) {
			const type = scope.entries.get(token.lexeme)!.typeAnnotation;
			return new VariableReferenceNode(token, type);
		}
		// Todo: Look up in scope identifiers, not just actions
		return new ActionReferenceNode(token);
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
		// Since ternary is right associative, we must subtract one from precedence
		const consequent = parser.expression(this.precedence - 1);
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

export class BinaryLogicalOperatorParselet implements InfixParselet {
	constructor(public readonly precedence: number) {}
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
		// We drop the precedence slightly for right associative operators
		// so that another right associative operator will bind more tightly
		const rhs: Expression = parser.expression(this.precedence);
		return new BinaryLogicalExpressionNode(token.type, lhs, rhs);
	}
}

export class PostfixOperatorParselet implements InfixParselet {
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
		return new PostfixExpressionNode(token, lhs);
	}
	public get precedence(): number {
		return Precedence.Primary;
	}
}

export class InvocationOperatorParselet implements InfixParselet {
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
		const args: Expression[] = [];
		let end: number = token.end;
		if (!parser.match(TokenType.ParenClose)) {
			do {
				args.push(parser.expression());
			} while (parser.match(TokenType.Comma));
			parser.consume(
				TokenType.ParenClose,
				"Expected closing parenthesis following action arguments"
			);
			end = parser.previous.end;
		}

		return new InvocationExpressionNode(lhs.start, end, lhs, args);
	}
	public get precedence(): number {
		return Precedence.Primary;
	}
}
