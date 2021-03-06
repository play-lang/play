import { Expression, NodeState, Statement } from "src/language/node";
import { TokenLike } from "src/language/token/token";
import { Environment } from "src/language/types/environment";
import { None, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class VariableDeclarationNode extends Statement {
	/** Name of the variable */
	public get variableName(): string {
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
		/** True if this node represents a property declaration for a model */
		public readonly isProperty: boolean = false,
		/** Value of the variable */
		public readonly expr?: Expression,
		/** Type of the variable */
		public readonly annotation?: string[]
	) {
		super(token, start, end);
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.expr?.setState({ ...state, parent: this });
	}

	public get typeAnnotation(): string[] {
		return this.annotation ? this.annotation : [];
	}

	/**
	 * Compute the type of the variable based on its type annotation given
	 * the current type checking environment
	 * @param env The current type checking environment
	 */
	public variableType(env: Environment): Type {
		if (this.annotation) {
			return Type.construct(this.annotation, !this.isImmutable);
		} else {
			// We must have an expression, so use its type as our type
			const exprType = this.expr!.type(env).copy();
			// Variables can be assignable if we're not immutable
			exprType.isAssignable = !this.isImmutable;
			return exprType;
		}
	}

	public type(env: Environment): Type {
		// Statements have "none" type
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitVariableDeclarationNode?.(this);
	}
}
