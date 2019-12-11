import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";
import { TypeInfo } from "../../language/type-system";
import { Visitor } from "../../language/visitor";
import { TypeChecker } from "../../type-checker/type-checker";

export class BinaryExpressionNode extends Expression {
	constructor(
		public readonly operatorType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(lhs.start, rhs.end);
	}

	// MARK: Expression
	public computeType(ast: AbstractSyntaxTree): string[] {
		switch (this.operatorType) {
			case TokenType.EqualEqual:
			case TokenType.BangEqual:
			case TokenType.LessThan:
			case TokenType.LessThanEqual:
			case TokenType.GreaterThan:
			case TokenType.GreaterThanEqual:
				return ["bool"]; // Relational operators
			case TokenType.Plus:
			case TokenType.Minus:
			case TokenType.Asterisk:
			case TokenType.Slash:
			case TokenType.Percent:
			case TokenType.Caret:
				return ["num"];
		}
		throw new Error(
			"Internal: Cannot reconcile token type " +
				TokenType[this.operatorType] +
				" in a binary expression node"
		);
	}

	public validate(tc: TypeChecker): void {}

	public computeReturnType(tc: TypeChecker): TypeInfo {
		switch (this.operatorType) {
			case TokenType.EqualEqual:
			case TokenType.BangEqual:
			case TokenType.LessThan:
			case TokenType.LessThanEqual:
			case TokenType.GreaterThan:
			case TokenType.GreaterThanEqual:
				return ["bool"]; // Relational operators
			case TokenType.Plus:
			case TokenType.Minus:
			case TokenType.Asterisk:
			case TokenType.Slash:
			case TokenType.Percent:
			case TokenType.Caret:
				return ["num"];
		}
	}

	public get isAddressable(): boolean {
		// The result of an assignment is addressable if the left-hand-side
		// is addressable
		return this.lhs.isAddressable;
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitBinaryExpressionNode(this);
	}
}
