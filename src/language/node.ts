import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export abstract class Node {
	/** Parent node or undefined if the root node */
	public parent: Node | undefined;

	/** Type of the syntax tree node */
	public get nodeName(): string {
		return this.constructor.name;
	}

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

	/** Set the parent of the node (recursive) */
	public abstract setParent(node: Node | undefined): void;
}

export abstract class Expression extends Node {}
export abstract class Statement extends Node {}
