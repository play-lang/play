import { Expression } from "../../language/node";
import { Visitor } from "../../language/visitor";

/**
 * Reference to a variable's value when used in an expression
 */
export class VariableReferenceNode extends Expression {
	constructor(
		/** Name of the variable in the scope where the variable was referenced */
		public readonly variableName: string
	) {
		super();
	}

	public accept(visitor: Visitor): void {
		visitor.visitVariableReferenceNode(this);
	}
}
