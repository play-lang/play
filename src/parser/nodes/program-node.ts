import { Node } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class ProgramNode extends Node {
	constructor(
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Program statements */
		public readonly statements: Node[]
	) {
		super(start, end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitProgramNode(this);
	}
}
