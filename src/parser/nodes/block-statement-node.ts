import { Node, Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { ErrorType, None, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

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
		// Set a flag on the last statement
		if (statements.length > 0) {
			statements[statements.length - 1].isLast = true;
		}
	}

	public setParent(node: Node | undefined): void {
		this.parent = node;
		this.statements.forEach(statement => statement.setParent(this));
	}

	public type(env: Environment): Type {
		// All statements in the block must be valid for the block type to be None
		// rather than ErrorType
		for (const statement of this.statements) {
			if (statement.type(env) instanceof ErrorType) {
				return new ErrorType(false);
			}
		}
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitBlockStatementNode?.(this);
	}
}
