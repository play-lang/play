import { Expression, Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Environment } from "../../language/types/environment";
import { constructType, Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";

export class VariableDeclarationNode extends Statement {
	/** Name of the variable */
	public get name(): string {
		return this.token.lexeme;
	}

	constructor(
		/** Variable name token */
		public readonly token: TokenLike,
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** True if the value can't be reassigned another value */
		public readonly isImmutable: boolean,
		/** Value of the variable */
		public readonly expr?: Expression,
		/** Type of the variable */
		public readonly annotation?: string[]
	) {
		super(token, start, end);
	}

	public get typeAnnotation(): string[] {
		return this.annotation ? this.annotation : [];
	}

	public type(env: Environment): Type {
		return this.annotation
			? constructType(this.annotation, false)
			: this.expr!.type(env);
	}

	public accept(visitor: Visitor): void {
		visitor.visitVariableDeclarationNode?.(this);
	}
}
