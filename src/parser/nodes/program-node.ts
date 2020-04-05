import { Node, NodeState, Statement } from "src/language/node";
import { TokenLike } from "src/language/token/token";
import { Environment } from "src/language/types/environment";
import { None, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";

export class ProgramNode extends Node {
	constructor(
		token: TokenLike,
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Program statements */
		public readonly statements: Statement[]
	) {
		super(token, start, end);
		// Force the whole tree to have back-references to their parent nodes
		this.setState({
			parent: undefined,
			isDead: false,
			isLast: false,
		});
		// Set a flag on the last statement
	}

	public setState(state: NodeState): void {
		this.state = state;
		let dead = state.isDead;
		this.statements.forEach(statement => {
			statement.setState({
				...state,
				parent: this,
				isDead: dead,
				isLast: statement === this.statements[this.statements.length - 1],
			});
			if (statement instanceof ReturnStatementNode) dead = true;
		});
	}

	public type(env: Environment): Type {
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitProgramNode?.(this);
	}
}
