import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { ErrorType, Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";
import { TypeChecker } from "../../type-checker/type-checker";
import { FunctionReferenceNode } from "./function-reference-node";

export class InvocationExpressionNode extends Expression {
	/** Name of the function to call */
	public get functionName(): string | undefined {
		if (this.lhs instanceof FunctionReferenceNode) {
			return this.lhs.functionName;
		}
	}

	constructor(
		/** Start position in the code */
		start: number,
		/** End position in the code */
		end: number,
		/** Left hand side expression preceding this call */
		public readonly lhs: Expression,
		/** Function call invocation argument expressions */
		public readonly args: Expression[]
	) {
		super(start, end);
		this.type = lhs.type;
	}

	public type(ast: AbstractSyntaxTree): Type {
		if (this.lhs instanceof FunctionReferenceNode) {
			return this.lhs.type(ast);
		}
		return new ErrorType(false);
	}

	public validate(tc: TypeChecker): void {
		// const type = this.type(tc.ast);
		// const params = new LinkedHashMap<
	}

	public accept(visitor: Visitor): void {
		visitor.visitInvocationExpressionNode(this);
	}
}
