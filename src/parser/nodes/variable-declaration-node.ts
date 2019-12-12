import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { IdentifierSymbol } from "../../language/identifier-symbol";
import { Expression, Statement } from "../../language/node";
import { TokenLike } from "../../language/token";
import { constructType, Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";
import { TypeChecker } from "../../type-checker/type-checker";

export class VariableDeclarationNode extends Statement
	implements IdentifierSymbol {
	/** Name of the variable */
	public get name(): string {
		return this.token.lexeme;
	}

	constructor(
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Variable name token */
		public readonly token: TokenLike,
		/** True if the value can't be reassigned another value */
		public readonly isImmutable: boolean,
		/** Value of the variable */
		public readonly expr?: Expression,
		/** Type of the variable */
		public readonly annotation?: string[]
	) {
		super(start, end);
	}

	public get typeAnnotation(): string[] {
		return this.annotation ? this.annotation : [];
	}

	public type(ast: AbstractSyntaxTree): Type {
		return this.typeAnnotation
			? constructType(this.typeAnnotation, false)
			: this.expr!.type(ast);
	}

	public validate(tc: TypeChecker): void {
		if (this.expr && this.typeAnnotation) {
			const type = this.type(tc.ast);
			const exprType = this.expr.type(tc.ast);
			if (!type.equivalent(exprType)) {
				// Report mismatch between variable's assigned value and variable's
				// expected value
				tc.mismatch(this.token, type, exprType);
			}
		}
	}

	public accept(visitor: Visitor): void {
		visitor.visitVariableDeclarationNode(this);
	}
}
