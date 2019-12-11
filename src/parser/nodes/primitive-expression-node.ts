import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { primitiveTypes, TokenType } from "../../language/token-type";
import { TypeInfo, TypeRule, TypeRuleset } from "../../language/type-system";
import { Visitor } from "../../language/visitor";
import { TypeChecker } from "../../type-checker/type-checker";

export class PrimitiveExpressionNode extends Expression {
	/** Literal type */
	public readonly primitiveType: TokenType;
	/** Literal value */
	public readonly primitiveValue: string;

	constructor(
		/** Primitive token */
		public readonly token: TokenLike
	) {
		super(token.pos, token.end);
		this.primitiveType = token.type;
		this.primitiveValue = token.lexeme;
	}

	// MARK: Expression

	public get ruleset(): TypeRuleset {
		// Construct a set of rules for the allowed primitive types
		return new TypeRuleset([
			new TypeRule(["num"]),
			new TypeRule(["str"]),
			new TypeRule(["bool"]),
			new TypeRule(["object"]),
		]);
	}

	public validate(tc: TypeChecker): void {
		const typeAnnotation = primitiveTypes.get(this.primitiveType)!;
		const type = new TypeInfo(typeAnnotation, false);
		tc.assertType(this.token, this.ruleset, type);
	}

	public get isAddressable(): boolean {
		return false;
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitPrimitiveExpressionNode(this);
	}
}
