import { Expression, Statement } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class ReturnStatementNode extends Statement {
	constructor(
		/** Return value, if any */
		public readonly expr?: Expression | undefined
	) {
		super();
	}

	public accept(visitor: Visitor): void {
		visitor.visitReturnStatementNode(this);
	}
}
