import { Expression, Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { Type, Void } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

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
