import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Visitor } from "../../language/visitor";

/**
 * When a function id is used in an expression as a function reference
 * for invocation (or whatever else), it parses into a function reference node
 */
export class FunctionReferenceNode extends Expression {
	public get functionName(): string {
		return this.token.lexeme;
	}

	constructor(
		/** Function reference token */
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
