import { Expression, Node } from "src/language/node";
import { TokenLike } from "src/language/token";
import { prefixTypeAnnotations, TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import { ErrorType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

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

	public setParent(node: Node | undefined): void {
		this.parent = node;
		this.rhs.setParent(this);
	}

	public type(env: Environment): Type {
		const rhsType = this.rhs.type(env);
		const annotation = prefixTypeAnnotations.get(this.token.type);
		if (annotation) {
			return Type.construct(annotation, rhsType.isAssignable);
		}
		return new ErrorType(rhsType.isAssignable);
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitPrefixExpressionNode?.(this);
	}
}
