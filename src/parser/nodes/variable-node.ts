import { Expression } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class VariableNode extends Expression {
	/** Program statements */
	public readonly symbolTableEntry:

	constructor;(value: string, typeAnnotation: string[]) {
		super();
	};

	public accept(visitor: Visitor);: void {
		visitor.visitValueNode(this);
	};
}
