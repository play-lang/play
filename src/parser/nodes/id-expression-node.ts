import { Expression } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { ErrorType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

/**
 * Identifier reference node
 */
export class IdExpressionNode extends Expression {
	/**
	 * True if the id is invoked as a function, as in `someId()` with
	 * parenthesis following
	 *
	 * The parser will come back to this node and set this to true if it finds a
	 * function invocation node immediately after (see InvocationOperatorParselet)
	 */
	public usedAsFunction: boolean = false;

	/** Identifier name */
	public get name(): string {
		return this.token.lexeme;
	}

	constructor(token: TokenLike) {
		super(token, token.pos, token.end);
	}

	public type(env: Environment): Type {
		const scope = env.symbolTable.findScope(this.name);
		if (scope) {
			// Identifier represents a variable
			return env.symbolTable.lookup(this.name)!.type!;
		}
		if (this.usedAsFunction) {
			// The id is invoked as a function, so see if it can be found in the
			// function table
			const info = env.functionTable.get(this.name);
			if (info) {
				return Type.construct(info.typeAnnotation);
			}
			return new ErrorType(false);
		}
		return new ErrorType(true);
	}

	public validate(): void {}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitIdExpressionNode?.(this);
	}
}
