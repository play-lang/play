import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression, Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Type, Void } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class ReturnStatementNode extends Statement {
	constructor(
		token: TokenLike /** Return value, if any */,
		public readonly expr?: Expression
	) {
		super(token.pos, expr ? expr.end : token.end);
	}

	public type(ast: AbstractSyntaxTree): Type {
		return this.expr ? this.expr.type(ast) : Void;
	}

	public accept(visitor: Visitor): void {
		visitor.visitReturnStatementNode(this);
	}
}
