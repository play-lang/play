import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class PrefixExpressionNode extends Expression {
	/** Operator type */
	public readonly operatorType: TokenType;

	constructor(
		/** Token for the operator */
		public readonly token: TokenLike,
		/** Right-hand side expression */
		public readonly rhs: Expression
	) {
		super(token.pos, rhs.end);
		this.operatorType = token.type;
		this.rhs = rhs;
	}

	// MARK: Expression
	public computeType(/* ast: AbstractSyntaxTree */): string[] {
		switch (this.operatorType) {
			case TokenType.Bang:
				return ["bool"];
			case TokenType.Plus:
			case TokenType.Minus:
			case TokenType.PlusPlus:
			case TokenType.MinusMinus:
				return ["num"];
		}
		throw new Error(
			"Internal: cannot reconcile token type " +
				TokenType[this.operatorType] +
				" in a prefix expression node"
		);
	}

	public get isAddressable(): boolean {
		switch (this.operatorType) {
			case TokenType.Bang:
			case TokenType.Plus:
			case TokenType.Minus:
				return false; // Uses rhs as a primitive type
			case TokenType.PlusPlus:
			case TokenType.MinusMinus:
				return true; // Uses rhs as a reference
		}
		return false;
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitPrefixExpressionNode(this);
	}
}
