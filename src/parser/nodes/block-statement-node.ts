import { Statement } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class BlockStatementNode extends Statement {
	/** Block statements */
	public readonly statements: Statement[];

	constructor(statements: Statement[]) {
		super();
		this.statements = statements;
	}

	public accept(visitor: Visitor): void {
		visitor.visitBlockStatementNode(this);
	}
}
