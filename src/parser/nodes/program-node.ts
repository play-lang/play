import { Visitor } from "../visitor/visitor";
import { Node } from "../../language/node";

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
