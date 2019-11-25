import { ActionInfo } from "../../language/action-info";
import { Statement } from "../../language/node";
import { Visitor } from "../../language/visitor";
import { BlockStatementNode } from "./block-statement-node";

export class ActionDeclarationNode extends Statement {
	constructor(
		/** Start position in the code */
		start: number,
		/** Action information */
		public readonly info: ActionInfo,
		/** Statements inside the action */
		public readonly block: BlockStatementNode
	) {
		super(start, block.end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitActionDeclarationNode(this);
	}
}
