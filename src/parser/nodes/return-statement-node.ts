import { Expression, Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Environment } from "../../language/types/environment";
import { Type, Void } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class ReturnStatementNode extends Statement {
	constructor(
		token: TokenLike /** Return value, if any */,
		public readonly expr?: Expression
	) {
		super(token, token.pos, expr ? expr.end : token.end);
	}

	public type(env: Environment): Type {
		return this.expr ? this.expr.type(env) : Void;
	}

	public accept(visitor: Visitor): void {
		visitor.visitReturnStatementNode?.(this);
	}
}
