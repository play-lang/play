import { Expression, NodeState, Statement } from "src/language/node";
import { TokenLike } from "src/language/token/token";
import { Environment } from "src/language/types/environment";
import { None, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class ReturnStatementNode extends Statement {
	constructor(
		token: TokenLike /** Return value, if any */,
		public readonly expr?: Expression
	) {
		super(token, token.pos, expr ? expr.end : token.end);
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.expr?.setState({ ...state, parent: this });
	}

	public type(env: Environment): Type {
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitReturnStatementNode?.(this);
	}
}
