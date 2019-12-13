import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { constructType, Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

/**
 * Reference to a variable's value when used in an expression
 */
export class VariableReferenceNode extends Expression {
	/** Name of the variable in the scope where the variable was referenced */
	public readonly variableName: string;

	constructor(
		token: TokenLike,
		/**
		 * Type annotation of the variable being referenced
		 *
		 * This is provided instead of linking to a symbol table entry for maximum
		 * succinctness
		 */
		public readonly typeAnnotation: string[]
	) {
		super(token.pos, token.end);
		this.variableName = token.lexeme;
	}

	public type(): Type {
		return constructType(this.typeAnnotation, true);
	}

	public validate(): void {}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitVariableReferenceNode?.(this);
	}
}
