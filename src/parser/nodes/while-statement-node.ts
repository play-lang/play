import { Expression, NodeState, Statement } from "src/language/node";
import { TokenLike } from "src/language/token/token";
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

	public setState(state: NodeState): void {
		this.state = state;
		this.condition.setState({ ...state, parent: this });
		this.block.setState({ ...state, parent: this });
	}

	public type(env: Environment): Type {
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitWhileStatementNode?.(this);
	}
}
