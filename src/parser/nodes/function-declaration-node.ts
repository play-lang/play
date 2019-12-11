import { FunctionInfo } from "../../language/function-info";
import { Statement } from "../../language/node";
import { Visitor } from "../../language/visitor";
import { BlockStatementNode } from "./block-statement-node";

export class FunctionDeclarationNode extends Statement {
	constructor(
		/** Start position in the code */
		start: number,
		/** Function information */
		public readonly info: FunctionInfo,
		/** Statements inside the function */
		public readonly block: BlockStatementNode
	) {
		super(start, block.end);
	}

	public accept(visitor: Visitor): void {
		visitor.visitActionDeclarationNode(this);
	}
}
