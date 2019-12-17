import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { Environment } from "../../language/types/environment";
import { ProductType } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";
import { IdExpressionNode } from "./id-expression-node";

export class InvocationExpressionNode extends Expression {
	/** Name of the function to call */
	public get functionName(): string | undefined {
		if (this.lhs instanceof IdExpressionNode) {
			return this.lhs.name;
		}
	}

	constructor(
		/** Opening parenthesis token */
		public readonly token: TokenLike,
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Left hand side expression preceding this call */
		public readonly lhs: Expression,
		/** Function call invocation argument expressions */
		public readonly args: Expression[]
	) {
		super(token, start, end);
	}

	public type(env: Environment): ProductType {
		return new ProductType(this.args.map(arg => arg.type(env)));
	}

	public accept(visitor: Visitor): void {
		visitor.visitInvocationExpressionNode?.(this);
	}
}
