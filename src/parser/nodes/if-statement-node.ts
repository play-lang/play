import { Expression, NodeState, Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { None, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";
import { ElseStatementNode } from "src/parser/nodes/else-statement-node";

export class IfStatementNode extends Statement {
	constructor(
		token: TokenLike,
		/** Expression to examine */
		public readonly predicate: Expression,
		/** Expression to evaluate if predicate is true */
		public readonly consequent: BlockStatementNode,
		/** Expression to evaluate if predicate is false */
		public readonly alternates: ElseStatementNode[] = []
	) {
		super(
			token,
			predicate.start,
			// End position is the end position of the last "else/else if" block, or,
			// if no else blocks are present, the consequent block end position
			alternates.length > 0
				? alternates[alternates.length - 1].end
				: consequent.end
		);
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.predicate.setState({ ...state, parent: this });
		this.consequent.setState({ ...state, parent: this });
		this.alternates.forEach(alternate => {
			alternate.setState({
				...state,
				parent: this,
				isLast:
					alternate === this.alternates[this.alternates.length - 1],
			});
		});
	}

	public type(env: Environment): Type {
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitIfStatementNode?.(this);
	}
}
