import { Node } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { Type, Void } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class ProgramNode extends Node {
	constructor(
		token: TokenLike,
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Program statements */
		public readonly statements: Node[]
	) {
		super(token, start, end);
	}

	public type(env: Environment): Type {
		return Void;
	}

	public accept(visitor: Visitor): void {
		visitor.visitProgramNode?.(this);
	}
}
