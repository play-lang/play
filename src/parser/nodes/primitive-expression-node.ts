import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { primitiveTypeAnnotations, TokenType } from "../../language/token-type";
import { Environment } from "../../language/types/environment";
import {
	constructType,
	ErrorType,
	Type,
} from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

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
			return constructType(annotation);
		}
		return new ErrorType(false);
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitPrimitiveExpressionNode?.(this);
	}
}
