import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token/token";
import { Environment } from "src/language/types/environment";
import { ErrorType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export enum IdExpressionUse {
	Function = 1,
	Variable,
}

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
	public use: IdExpressionUse = IdExpressionUse.Variable;

	/** Identifier name */
	public get name(): string {
		return this.token.lexeme;
	}

	constructor(token: TokenLike) {
		super(token, token.pos, token.end);
	}

	public setState(state: NodeState): void {
		this.state = state;
	}

	public type(env: Environment): Type {
		const scope = env.symbolTable.scope.findScope(this.name);
		if (scope) {
			// Identifier represents a variable (takes priority over other uses)
			return env.symbolTable.scope.lookup(this.name)!.type!;
		}
		switch (this.use) {
			case IdExpressionUse.Function: {
				// The id is invoked as a function, so see if it can be found in the
				// function table
				const info = env.functionTable.get(this.name);
				if (info) {
					return Type.construct(info.typeAnnotation);
				}
				return new ErrorType(false);
			}
			case IdExpressionUse.Variable: {
				// Didn't find variable in scope above so return error
				return new ErrorType(false);
			}
		}
	}

	public validate(): void {}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitIdExpressionNode?.(this);
	}
}
