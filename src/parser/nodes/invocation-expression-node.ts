import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token/token";
import { Environment } from "src/language/types/environment";
import {
	ErrorType,
	FunctionType,
	InstanceType,
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

	/**
	 * If this call represents an invocation of a native function, this
	 * specifies the index of the native function to call
	 *
	 * This is set by the type-checker when types are computed, so code
	 * involving native functions must be type-checked before being compiled
	 */
	public nativeFunctionIndex: number | undefined;

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
		const functionType = this.functionType(env);
		if (functionType instanceof FunctionType) {
			return functionType.returnType;
		}
		return new ErrorType();
	}

	/** Compute the invocation arguments type as a product type */
	public argumentsType(env: Environment): ProductType {
		// Compute the product type that represents the type of the arguments
		// in the invocation expression
		return new ProductType(this.args.map(arg => arg.type(env)));
	}

	/**
	 * Find the type of the function or method being invoked based on the given
	 * environment
	 */
	public functionType(env: Environment): Type {
		const functionName = this.functionName!;
		if (this.receiver) {
			// Method invocation
			const receiverType = this.receiver.type(env);
			if (
				receiverType instanceof InstanceType &&
				receiverType.constructorType
			) {
				for (const func of receiverType.constructorType.functions) {
					if (func.name === functionName) {
						// Our function matches a method on the receiver
						return func;
					}
				}
			}
		} else if (env.functionTable.has(functionName)) {
			// Global function invocation
			const info = env.functionTable.get(functionName)!;
			return info.type!;
		}
		return new ErrorType();
	}

	public accept(visitor: Visitor): void {
		visitor.visitInvocationExpressionNode?.(this);
	}
}
