import { FunctionInfo } from "../../language/function-info";
import { Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Environment } from "../../language/types/environment";
import { constructFunctionType, Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";
import { BlockStatementNode } from "./block-statement-node";

export class FunctionDeclarationNode extends Statement {
	constructor(
		token: TokenLike,
		/** Start position in the code */
		start: number,
		/** Function information */
		public readonly info: FunctionInfo,
		/** Statements inside the function */
		public readonly block: BlockStatementNode
	) {
		super(token, start, block.end);
	}

	public type(env: Environment): Type {
		return constructFunctionType(this.info);
	}

	public accept(visitor: Visitor): void {
		visitor.visitFunctionDeclarationNode?.(this);
	}
}
