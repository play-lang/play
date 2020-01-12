import { Expression } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import {
	FunctionType,
	ProductType,
	Type,
} from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { IdExpressionNode } from "src/parser/nodes/id-expression-node";

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

	public type(env: Environment): Type {
		const functionName = this.functionName;
		if (functionName) {
			const info = env.functionTable.get(functionName);
			if (info) {
				const type = info.type;
				if (type && type instanceof FunctionType) {
					return type.returnType;
				}
			}
		}
		throw new Error(
			"Can't compute function return type for " + functionName
		);
	}

	public argumentsType(env: Environment): ProductType {
		return new ProductType(this.args.map(arg => arg.type(env)));
	}

	public accept(visitor: Visitor): void {
		visitor.visitInvocationExpressionNode?.(this);
	}
}
