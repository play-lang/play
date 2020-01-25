import { FunctionInfo } from "src/language/function-info";
import { Node, Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { ErrorType, Type } from "src/language/types/type-system";
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

	public setParent(node: Node | undefined): void {
		this.parent = node;
		this.block.setParent(this);
	}

	public type(env: Environment): Type {
		// Check that the block has a valid error type
		const blockType = this.block.type(env);
		if (blockType instanceof ErrorType) return new ErrorType(false);
		return Type.constructFunction(this.info);
	}

	public accept(visitor: Visitor): void {
		visitor.visitFunctionDeclarationNode?.(this);
	}
}
