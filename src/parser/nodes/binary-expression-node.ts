import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";
import {
	constructType,
	ErrorType,
	Type,
} from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class BinaryExpressionNode extends Expression {
	constructor(
		public readonly operatorType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(lhs.start, rhs.end);
	}

	public type(ast: AbstractSyntaxTree): Type {
		const bool = constructType(["bool"]);
		const num = constructType(["num"]);
		const str = constructType(["str"]);
		switch (this.operatorType) {
			case TokenType.EqualEqual:
			case TokenType.BangEqual:
			case TokenType.LessThan:
			case TokenType.LessThanEqual:
			case TokenType.GreaterThan:
			case TokenType.GreaterThanEqual:
				return bool;
			case TokenType.Plus:
				// Plus is overloaded to support string concatenation
				// and numeric addition
				//
				// We check for string concatenation by checking if the lhs and rhs
				// are string types
				if (
					this.lhs.type(ast).equivalent(str) &&
					this.rhs.type(ast).equivalent(str)
				) {
					return str;
				}
				return num;
			case TokenType.Minus:
			case TokenType.Asterisk:
			case TokenType.Slash:
			case TokenType.Percent:
			case TokenType.Caret:
				return num;
		}
		return new ErrorType(false);
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitBinaryExpressionNode?.(this);
	}
}
