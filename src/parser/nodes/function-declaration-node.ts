import { FunctionInfo } from "src/language/function-info";
import { Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { constructFunctionType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";

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
