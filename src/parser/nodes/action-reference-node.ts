import { formatSemanticError } from "../../common/format-messages";
import { Expression } from "../../language/node";
import { SemanticError } from "../../language/semantic-error";
import { TokenLike } from "../../language/token";
import { AddressConstraint, TypeRule } from "../../language/type-system";
import { Visitor } from "../../language/visitor";
import { TypeChecker } from "../../type-checker/type-checker";

/**
 * When an action id is used in an expression as an action reference
 * for invocation (or whatever else), it parses into an action reference node
 */
export class ActionReferenceNode extends Expression {
	public get actionName(): string {
		return this.token.lexeme;
	}

	constructor(
		/** Action reference token */
		public readonly token: TokenLike
	) {
		super(token.pos, token.end);
	}

	// MARK: Expression

	public validate(tc: TypeChecker): void {
		// Not a type check, but it does ensure the action is found in the
		// action table
		const info = tc.ast.actionTable.get(this.actionName);
		if (!info) {
			tc.report(
				new SemanticError(
					this.token,
					formatSemanticError(
						this.token,
						"Cannot reference undeclared action " + "`" + this.actionName + "`"
					)
				)
			);
		}
	}

	public computeReturnType(tc: TypeChecker): TypeRule {
		const info = tc.ast.actionTable.get(this.actionName)!;
		// Unlike other things represented by identifiers,
		// action references are not assignable
		return new TypeRule(
			info.typeAnnotation,
			AddressConstraint.NonAddressableOnly
		);
	}

	public get isAddressable(): boolean {
		return false;
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitActionReferenceNode(this);
	}
}
