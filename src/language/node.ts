import { TokenLike } from "src/language/token/token";
import { Environment } from "src/language/types/environment";
import { Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export interface NodeState {
	/** Parent node */
	readonly parent: Node | undefined;
	/**
	 * True if the node is unreachable because a return statement comes before
	 * it in the same block
	 */
	readonly isDead: boolean;
	/**
	 * True if the node is the last node in its parent (if its parent holds
	 * more than one node)
	 */
	readonly isLast: boolean;
}

export abstract class Node {
	/**
	 * Parent node
	 *
	 * Parent node is needed to check that a node occurs under the correct parent,
	 * as the parser is more forgiving than the type checker
	 */
	public get parent(): Node | undefined {
		return this.state.parent;
	}

	/**
	 * True if the node is unreachable because a return statement comes before
	 * it in the same block
	 *
	 * The type checker uses this to issue warnings about unreachable code
	 * and the compiler avoids compiling unreachable code
	 */
	public get isDead(): boolean {
		return this.state.isDead;
	}

	/**
	 * True if the node is the last node in its parent (if its parent holds
	 * more than one node)
	 *
	 * Last-ness can help the compiler determine whether or not a node can be
	 * tail-recursive optimized
	 */
	public get isLast(): boolean {
		return this.state.isLast;
	}

	/** Type of the syntax tree node */
	public get nodeName(): string {
		return this.constructor.name;
	}
	/** Parent node or undefined if the root node */
	public state: NodeState = {
		parent: undefined,
		isDead: false,
		isLast: false,
	};

	constructor(
		public readonly token: TokenLike,
		/** Start index of the node in the source */
		public readonly start: number,
		/** End index of the node in the source */
		public readonly end: number
	) {}

	/** Type of the node for use with type checking */
	public abstract type(env: Environment): Type;

	/** Accept the specified visitor */
	public abstract accept(visitor: Visitor): any;

	/** Recursively set properties on the tree */
	public abstract setState(state: NodeState): void;
}

export abstract class Expression extends Node {}
export abstract class Statement extends Node {}
