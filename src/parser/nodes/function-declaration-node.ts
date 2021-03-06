import { FunctionInfo } from "src/language/info/function-info";
import { NodeState, Statement } from "src/language/node";
import { TokenLike } from "src/language/token/token";
import { Environment } from "src/language/types/environment";
import { ErrorType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";

export class FunctionDeclarationNode extends Statement {
	/** True if this node represents a method declaration for a model */
	public isMethod: boolean = false;

	constructor(
		token: TokenLike,
		/** Start position in the code */
		start: number,
		/** Function information */
		public readonly info: FunctionInfo,
		/** Statements inside the function */
		public readonly block: BlockStatementNode
	) {
		super(token, start, block.end);
	}

	public setState(state: NodeState): void {
		// Function declarations can occur after a return statement in the main
		// program
		//
		// Make sure we mark ourselves as reachable
		//
		this.state = { ...state, isDead: false };
		this.block.setState({ ...state, isDead: false, parent: this });
	}

	public type(env: Environment): Type {
		// Check that the block has a valid error type
		const blockType = this.block.type(env);
		if (blockType instanceof ErrorType) return new ErrorType(false);
		return Type.constructFunction(this.info);
	}

	public accept(visitor: Visitor): void {
		visitor.visitFunctionDeclarationNode?.(this);
	}
}
