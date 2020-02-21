import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import {
	FunctionType,
	ProductType,
	Type,
} from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { FunctionDeclarationNode } from "src/parser/nodes/function-declaration-node";
import { IdExpressionNode } from "src/parser/nodes/id-expression-node";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";

export class InvocationExpressionNode extends Expression {
	/**
	 * If the invocation is invoked as a method with the member access operator,
	 * this will be set to the expression that is believed to be the receiver
	 * of the method call
	 */
	public receiver: Expression | undefined;

	/**
	 * True if the invocation is a recursive call in tail position
	 *
	 * This is true if the invocation is the immediate child of a return statement
	 * (i.e., happens in the expression immediately before returning) and the
	 * function being called is the same one that contains this invocation
	 * expression
	 */
	public get isTailRecursive(): boolean {
		return (
			this.parent instanceof ReturnStatementNode &&
			this.parentFunction === this.functionName
		);
	}

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

	/**
	 * Find the name of the function which contains the receiver node
	 *
	 * If this node is not contained inside a function, it returns the
	 * main context's name identifier
	 */
	public get parentFunction(): string {
		let n = this.parent;
		while (n && !(n instanceof FunctionDeclarationNode)) {
			n = n.parent;
		}
		if (n) {
			return n.info.name;
		}
		return "(main)";
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.lhs.setState(state);
		this.args.forEach(arg =>
			arg.setState({
				...state,
				parent: this,
				isLast: arg === this.args[this.args.length - 1],
			})
		);
	}

	public type(env: Environment): Type {
		// Find the return type of the invoked function
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
		throw new Error("Can't compute function return type for " + functionName);
	}

	public argumentsType(env: Environment): ProductType {
		// Compute the product type that represents the type of the arguments
		// in the invocation expression
		return new ProductType(this.args.map(arg => arg.type(env)));
	}

	public accept(visitor: Visitor): void {
		visitor.visitInvocationExpressionNode?.(this);
	}
}
