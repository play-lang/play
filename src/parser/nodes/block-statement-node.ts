import { Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Environment } from "../../language/types/environment";
import { Type, Void } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class BlockStatementNode extends Statement {
	constructor(
		token: TokenLike,
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Block statements */
		public readonly statements: Statement[],
		/** True if the block represents a function block */
		public readonly isFunctionBlock: boolean
	) {
		super(token, start, end);
	}

	public type(env: Environment): Type {
		// Todo: synthesize type
		// Examine return statements in this block to figure out / enforce what
		// the return type is
		return Void;
	}

	public accept(visitor: Visitor): void {
		visitor.visitBlockStatementNode?.(this);
	}
}
