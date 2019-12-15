import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { postfixTypeAnnotations, TokenType } from "../../language/token-type";
import { Environment } from "../../language/types/environment";
import {
	constructType,
	ErrorType,
	Type,
} from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

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

	public type(env: Environment): Type {
		const lhsType = this.lhs.type(env);
		const annotation = postfixTypeAnnotations.get(this.token.type);
		if (annotation) {
			return constructType(annotation, lhsType.isAssignable);
		}
		return new ErrorType(lhsType.isAssignable);
	}

	public accept(visitor: Visitor): void {
		visitor.visitPostfixExpressionNode?.(this);
	}
}
