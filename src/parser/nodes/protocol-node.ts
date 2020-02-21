import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { ErrorType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class ProtocolNode extends Expression {
	constructor(token: TokenLike) {
		super(token, token.pos, token.end);
	}

	public setState(state: NodeState): void {
		this.state = state;
	}

	public type(env: Environment): Type {
		return new ErrorType();
	}

	public accept(visitor: Visitor): void {
		visitor.visitModelNode?.(this);
	}
}
