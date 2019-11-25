import { Expression } from "../../language/node";
import { Visitor } from "../../language/visitor";

/**
 * When an action id is used in an expression as an action reference
 * for invocation (or whatever else), it parses into an action reference node
 */
export class ActionReferenceNode extends Expression {
	constructor(
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Name of the action (can be forward-declared, hence just a string) */
		public readonly actionName: string
	) {
		super(start, end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitActionReferenceNode(this);
	}
}
