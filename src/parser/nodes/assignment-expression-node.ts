import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { TokenType } from "../../language/token-type";
import {
	constructType,
	ErrorType,
	Type,
} from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class AssignmentExpressionNode extends Expression {
	constructor(
		public readonly token: TokenLike,
		public readonly assignmentType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(lhs.start, rhs.end);
	}

	public type(ast: AbstractSyntaxTree): Type {
		const str = constructType(["str"]);
		const num = constructType(["num"]);
		switch (this.assignmentType) {
			case TokenType.Equal:
				return this.lhs.type(ast);
			case TokenType.PlusEqual:
				if (
					this.lhs.type(ast).equivalent(str) &&
					this.rhs.type(ast).equivalent(str)
				) {
					return str;
				}
				return num;
			case TokenType.MinusEqual:
			case TokenType.AsteriskEqual:
			case TokenType.SlashEqual:
			case TokenType.PercentEqual:
			case TokenType.CaretEqual:
				return num;
		}
		return new ErrorType(false);
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitAssignmentExpressionNode(this);
	}
}
