import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token";
import { postfixTypeAnnotations, TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import {
	CollectionType,
	ErrorType,
	Type,
} from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class PostfixExpressionNode extends Expression {
	/** Operator type */
	public readonly operatorType: TokenType;

	constructor(
		/** Token for the operator */
		public readonly token: TokenLike,
		/** Left-hand side expression */
		public readonly lhs: Expression
	) {
		super(token, lhs.start, token.end);
		this.operatorType = token.type;
		this.lhs = lhs;
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.lhs.setState({ ...state, parent: this });
	}

	public type(env: Environment): Type {
		const lhsType = this.lhs.type(env);
		const annotation = postfixTypeAnnotations.get(this.token.type);
		if (annotation) {
			return Type.construct(
				annotation,
				lhsType.isAssignable || lhsType instanceof CollectionType
			);
		}
		return new ErrorType(lhsType.isAssignable);
	}

	public accept(visitor: Visitor): void {
		visitor.visitPostfixExpressionNode?.(this);
	}
}
