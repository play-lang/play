import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Environment } from "../../language/types/environment";
import {
	constructType,
	ErrorType,
	Type,
} from "../../language/types/type-system";
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
		super(token, token.pos, token.end);
	}

	public type(env: Environment): Type {
		const info = env.functionTable.get(this.functionName);
		if (info) {
			return constructType(info.typeAnnotation);
		}
		return new ErrorType(false);
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitFunctionReferenceNode?.(this);
	}
}
