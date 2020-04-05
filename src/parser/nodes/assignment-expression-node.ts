import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token/token";
import { TokenType } from "src/language/token/token-type";
import { Environment } from "src/language/types/environment";
import { ErrorType, Num, Str, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { IndexExpressionNode } from "src/parser/nodes/index-expression-node";
import { MemberAccessExpressionNode } from "src/parser/nodes/member-access-expression-node";

export class AssignmentExpressionNode extends Expression {
	constructor(
		public readonly token: TokenLike,
		public readonly assignmentType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(token, lhs.start, rhs.end);
		if (
			lhs instanceof IndexExpressionNode ||
			lhs instanceof MemberAccessExpressionNode
		) {
			// Left-hand side is an index expression (`array[index] = value`) or
			// member access expression (`item.value = 10`) and is used in an
			// assignment statement
			lhs.lValue = true;
		}
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.lhs.setState({ ...state, parent: this });
		this.rhs.setState({ ...state, parent: this });
	}

	public type(env: Environment): Type {
		const str = Str;
		const num = Num;
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
