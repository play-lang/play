import { Expression, TypeCheckable } from "../../language/node";
import { TokenLike } from "../../language/token";
import { primitiveTypes, TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class PrimitiveExpressionNode extends Expression
	implements TypeCheckable {
	/** Literal type */
	public readonly primitiveType: TokenType;
	/** Literal value */
	public readonly primitiveValue: string;

	constructor(token: TokenLike) {
		super(token.pos, token.end);
		this.primitiveType = token.type;
		this.primitiveValue = token.lexeme;
	}

	// MARK: Expression
	public computeType(/* ast: AbstractSyntaxTree */): string[] {
		return primitiveTypes.get(this.primitiveType)!;
	}

	public get isAddressable(): boolean {
		return false;
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitPrimitiveExpressionNode(this);
	}
}
