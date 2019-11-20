import { Statement } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class BlockStatementNode extends Statement {
	constructor(
		/** Block statements */
		public readonly statements: Statement[],
		/** True if the block represents an action (function) block */
		public readonly isActionBlock: boolean
	) {
		super();
	}

	public accept(visitor: Visitor): void {
		visitor.visitBlockStatementNode(this);
	}
}
