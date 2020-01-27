import { Expression, NodeState, Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { None, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";

export class ElseStatementNode extends Statement {
	constructor(
		token: TokenLike,
		/** Expression to examine */
		public readonly expr: Expression | undefined,
		/** Statements to evaluate */
		public readonly block: BlockStatementNode
	) {
		super(token, block.start, block.end);
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.expr?.setState({ ...state, parent: this });
		this.block.setState({ ...state, parent: this });
	}

	public type(env: Environment): Type {
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitElseStatementNode?.(this);
	}
}
