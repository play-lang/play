import { Expression, Node, Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { None, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";

export class WhileStatementNode extends Statement {
	constructor(
		token: TokenLike,
		/** Expression to examine */
		public readonly condition: Expression,
		/** Block to evaluate while condition is true */
		public readonly block: BlockStatementNode
	) {
		super(token, condition.start, block.end);
	}

	public setParent(node: Node | undefined): void {
		this.parent = node;
		this.condition.setParent(this);
		this.block.setParent(this);
	}

	public type(env: Environment): Type {
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitWhileStatementNode?.(this);
	}
}
