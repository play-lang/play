import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Visitor } from "../../language/visitor";

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

	public get isAddressable(): boolean {
		return false;
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitActionReferenceNode(this);
	}
}
