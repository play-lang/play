import { Node } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class ProgramNode extends Node {
	/** Program statements */
	public readonly statements: Node[];

	constructor(statements: Node[]) {
		super();
		this.statements = statements;
	}

	public accept(visitor: Visitor): void {
		visitor.visitProgramNode(this);
	}
}
