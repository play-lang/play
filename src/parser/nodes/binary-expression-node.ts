import { Expression } from "src/language/node";
import { TokenLike } from "src/language/token";
import { TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import {
	Any,
	Bool,
	ErrorType,
	Num,
	Str,
	Type,
} from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class BinaryExpressionNode extends Expression {
	constructor(
		token: TokenLike,
		public readonly operatorType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(token, lhs.start, rhs.end);
	}

	public type(env: Environment): Type {
		switch (this.operatorType) {
			case TokenType.EqualEqual:
			case TokenType.BangEqual:
			case TokenType.LessThan:
			case TokenType.LessThanEqual:
			case TokenType.GreaterThan:
			case TokenType.GreaterThanEqual:
				return Bool;
			case TokenType.Plus:
				// Plus is overloaded to support string concatenation
				// and numeric addition
				//
				// We check for string concatenation by checking if the lhs and rhs
				// are string types
				if (
					this.lhs.type(env).equivalent(Str) &&
					this.rhs.type(env).equivalent(Str)
				) {
					return Str;
				} else if (
					this.lhs.type(env).equivalent(Num) &&
					this.rhs.type(env).equivalent(Num)
				) {
					return Num;
				}
				return new ErrorType(false);
			case TokenType.Minus:
			case TokenType.Asterisk:
			case TokenType.Slash:
			case TokenType.Percent:
			case TokenType.Caret:
				return Num;
		}
		return new ErrorType(false);
	}

	public operandType(env: Environment): Type {
		switch (this.operatorType) {
			case TokenType.EqualEqual:
			case TokenType.BangEqual:
				return Any;
			case TokenType.LessThan:
			case TokenType.LessThanEqual:
			case TokenType.GreaterThan:
			case TokenType.GreaterThanEqual:
				return Num;
			case TokenType.Plus:
			// return
			case TokenType.Minus:
			case TokenType.Asterisk:
			case TokenType.Slash:
			case TokenType.Percent:
			case TokenType.Caret:
				return Num;
		}
		return new ErrorType(false);
	}

	/**
	 * Provides a string description of what the binary operator does for
	 * type checking error reporting
	 * @param env Type checking environment
	 */
	public action(env: Environment): string {
		switch (this.operatorType) {
			case TokenType.EqualEqual:
			case TokenType.BangEqual:
			case TokenType.LessThan:
			case TokenType.LessThanEqual:
			case TokenType.GreaterThan:
			case TokenType.GreaterThanEqual:
				return "compare";
			case TokenType.Plus:
				// Plus is overloaded to support string concatenation
				// and numeric addition
				//
				// We check for string concatenation by checking if the lhs and rhs
				// are string types
				if (
					this.lhs.type(env).equivalent(Str) &&
					this.rhs.type(env).equivalent(Str)
				) {
					return "concatenate";
				}
				return "add";
			case TokenType.Minus:
				return "subtract";
			case TokenType.Asterisk:
				return "multiply";
			case TokenType.Slash:
				return "divide";
			case TokenType.Percent:
				return "take the remainder";
			case TokenType.Caret:
				return "raise to the power";
		}
		return "(invalid operation)";
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitBinaryExpressionNode(this);
	}
}
