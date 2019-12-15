import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { prefixTypeAnnotations, TokenType } from "../../language/token-type";
import { Environment } from "../../language/types/environment";
import {
	constructType,
	ErrorType,
	Type,
} from "../../language/types/type-system";
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
		super(token, token.pos, rhs.end);
		this.operatorType = token.type;
		this.rhs = rhs;
	}

	public type(env: Environment): Type {
		const rhsType = this.rhs.type(env);
		const annotation = prefixTypeAnnotations.get(this.token.type);
		if (annotation) {
			return constructType(annotation, rhsType.isAssignable);
		}
		return new ErrorType(rhsType.isAssignable);
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitPrefixExpressionNode?.(this);
	}
}
