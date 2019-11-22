import { IdentifierSymbol } from "../../language/identifier-symbol";
import { Expression, Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Visitor } from "../../language/visitor";

export class VariableDeclarationNode extends Statement
	implements IdentifierSymbol {
	/** Name of the variable */
	public get name(): string {
		return this.token.lexeme;
	}

	constructor(
		/** Variable name token */
		public readonly token: TokenLike,
		/** Type of the variable */
		public readonly typeAnnotation: string[],
		/** True if the value can't be reassigned another value */
		public readonly isImmutable: boolean,
		/** Value of the variable */
		public readonly expr?: Expression
	) {
		super();
	}

	public accept(visitor: Visitor): void {
		visitor.visitVariableDeclarationNode(this);
	}
}
