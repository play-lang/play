import { Statement } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class BlockStatementNode extends Statement {
	constructor(
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Block statements */
		public readonly statements: Statement[],
		/** True if the block represents an action (function) block */
		public readonly isActionBlock: boolean
	) {
		super(start, end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitBlockStatementNode(this);
	}
}
