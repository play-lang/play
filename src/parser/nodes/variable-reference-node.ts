import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Environment } from "../../language/types/environment";
import { constructType, Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

/**
 * Reference to a variable's value when used in an expression
 */
export class VariableReferenceNode extends Expression {
	/** Name of the variable in the scope where the variable was referenced */
	public readonly variableName: string;

	constructor(token: TokenLike) {
		super(token, token.pos, token.end);
		this.variableName = token.lexeme;
	}

	public type(env: Environment): Type {
		// Todo: Refactor this to be an identifier reference
		// resolved at type-checking time
		return constructType(
			env.symbolTable.lookup(this.variableName)!.typeAnnotation,
			true
		);
	}

	public validate(): void {}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitVariableReferenceNode?.(this);
	}
}
