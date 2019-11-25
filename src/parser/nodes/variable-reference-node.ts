import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Visitor } from "../../language/visitor";

/**
 * Reference to a variable's value when used in an expression
 */
export class VariableReferenceNode extends Expression {
	/** Name of the variable in the scope where the variable was referenced */
	public readonly variableName: string;

	constructor(token: TokenLike) {
		super(token.pos, token.end);
		this.variableName = token.lexeme;
	}

	public accept(visitor: Visitor): void {
		visitor.visitVariableReferenceNode(this);
	}
}
