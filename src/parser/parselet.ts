import { Expression } from "src/language/node";
import { Precedence } from "src/language/precedence";
import { TokenLike } from "src/language/token";
import { TokenType } from "src/language/token-type";
import { AssignmentExpressionNode } from "src/parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "src/parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "src/parser/nodes/binary-logical-expression-node";
import {
	IdExpressionNode,
	IdExpressionUse,
} from "src/parser/nodes/id-expression-node";
import { IndexExpressionNode } from "src/parser/nodes/index-expression-node";
import { InvocationExpressionNode } from "src/parser/nodes/invocation-expression-node";
import { ListNode } from "src/parser/nodes/list-node";
import { MapNode } from "src/parser/nodes/map-node";
import { MemberAccessExpressionNode } from "src/parser/nodes/member-access-expression-node";
import { PostfixExpressionNode } from "src/parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "src/parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "src/parser/nodes/primitive-expression-node";
import { TernaryConditionalNode } from "src/parser/nodes/ternary-conditional-node";
import { Parser } from "src/parser/parser";

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

export class ListParselet implements PrefixParselet {
	public parse(parser: Parser, token: TokenLike): ListNode {
		const members: Expression[] = [];
		let finished = false;
		do {
			parser.eatLines();
			if (parser.match(TokenType.BracketClose)) {
				finished = true;
				break;
			}
			members.push(parser.expression());
			parser.eatLines();
		} while (parser.match(TokenType.Comma));
		if (!finished) {
			parser.consume(TokenType.BracketClose, "Expected close bracket");
		}
		return new ListNode(token, members);
	}
}

export class MapParselet implements PrefixParselet {
	public parse(parser: Parser, token: TokenLike): MapNode {
		const keys: Expression[] = [];
		const values: Expression[] = [];
		let finished = false;
		do {
			parser.eatLines();
			if (parser.match(TokenType.BraceClose)) {
				finished = true;
				break;
			}
			const key = parser.expression();
			if (key instanceof IdExpressionNode && !parser.scope.lookup(key.name)) {
				// Plain id's can be used as map keys if they aren't used as variables
				key.use = IdExpressionUse.MapKey;
			}
			keys.push(key);
			parser.eatLines();
			parser.consume(TokenType.Colon, "Expected colon following map key");
			parser.eatLines();
			values.push(parser.expression());
			parser.eatLines();
		} while (parser.match(TokenType.Comma));
		if (!finished) {
			parser.consume(
				TokenType.BraceClose,
				"Expected closing brace for map literal"
			);
		}
		return new MapNode(token, keys, values);
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
		return new TernaryConditionalNode(token, predicate, consequent, alternate);
	}
	public get precedence(): number {
		return Precedence.Conditional;
	}
}

export class AssignmentParselet implements InfixParselet {
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
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
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
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
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
		// We drop the precedence slightly for right associative operators
		// so that another right associative operator will bind more tightly
		const rhs: Expression = parser.expression(this.precedence);
		return new BinaryLogicalExpressionNode(token, token.type, lhs, rhs);
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
		if (lhs instanceof IdExpressionNode) {
			lhs.use = IdExpressionUse.Function;
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

export class IndexOperatorParselet implements InfixParselet {
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
		const expr = parser.expression();
		parser.consume(TokenType.BracketClose, "Expected closing bracket");
		return new IndexExpressionNode(token, lhs, expr, parser.previous.pos);
	}
	public get precedence(): number {
		return Precedence.Primary;
	}
}

export class MemberAccessOperatorParselet implements InfixParselet {
	public parse(parser: Parser, lhs: Expression, token: TokenLike): Expression {
		const rhs = parser.expression();
		return new MemberAccessExpressionNode(token, lhs, rhs);
	}
	public get precedence(): number {
		return Precedence.Primary;
	}
}
