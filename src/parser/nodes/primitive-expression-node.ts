import { Expression } from "src/language/node";
import { TokenLike } from "src/language/token";
import { primitiveTypeAnnotations, TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import { ErrorType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class PrimitiveExpressionNode extends Expression {
	/** Literal type */
	public readonly primitiveType: TokenType;
	/** Literal value */
	public readonly primitiveValue: string;

	constructor(
		/** Primitive token */
		public readonly token: TokenLike
	) {
		super(token, token.pos, token.end);
		this.primitiveType = token.type;
		this.primitiveValue = token.lexeme;
	}

	public type(env: Environment): Type {
		const annotation = primitiveTypeAnnotations.get(this.token.type);
		if (annotation) {
			return Type.construct(annotation);
		}
		return new ErrorType(false);
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitPrimitiveExpressionNode?.(this);
	}
}
