import { Node } from "../../language/node";
import { Type, Void } from "../../language/types/type-system";
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

	public type(): Type {
		return Void;
	}

	public validate(): void {}

	public accept(visitor: Visitor): void {
		// TODO: Infer type
		// Make this analyze outer level return statements to infer return type
		visitor.visitProgramNode(this);
	}
}
