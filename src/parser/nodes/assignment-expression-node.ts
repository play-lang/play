import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { TokenType } from "../../language/token-type";
import { Environment } from "../../language/types/environment";
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
		super(token, lhs.start, rhs.end);
	}

	public type(env: Environment): Type {
		const str = constructType(["str"]);
		const num = constructType(["num"]);
		switch (this.assignmentType) {
			case TokenType.Equal:
				return this.lhs.type(env);
			case TokenType.PlusEqual:
				if (
					this.lhs.type(env).equivalent(str) &&
					this.rhs.type(env).equivalent(str)
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
		visitor.visitAssignmentExpressionNode?.(this);
	}
}
