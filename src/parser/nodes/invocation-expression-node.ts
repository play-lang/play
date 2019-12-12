import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import {
	constructFunctionType,
	ProductType,
} from "../../language/types/type-system";
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
		super(start, end);
	}

	public type(ast: AbstractSyntaxTree): ProductType {
		return new ProductType(this.args.map(arg => arg.type(ast)));
	}

	public validate(tc: TypeChecker): void {
		const type = this.type(tc.ast);
		// TODO: Add better error handling for invalid action calls
		if (this.functionName && tc.ast.functionTable.has(this.functionName)) {
			const functionInfo = tc.ast.functionTable.get(this.functionName!)!;
			const functionType = constructFunctionType(functionInfo);
			if (type.satisfiesRecordType(functionType.parameters)) {
				tc.mismatch(this.token, functionType.parameters, type);
			}
		} else {
			// TODO: Semantic error here for unrecognized function
		}
	}

	public accept(visitor: Visitor): void {
		visitor.visitInvocationExpressionNode(this);
	}
}
