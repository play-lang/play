import { Type } from "../language/types/type-system";
import { AbstractSyntaxTree } from "./abstract-syntax-tree";
import { TokenLike } from "./token";
import { Visitor } from "./visitor";

export abstract class Node {
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
	public abstract type(ast: AbstractSyntaxTree): Type;

	/** Accept the specified visitor */
	public abstract accept(visitor: Visitor): any;
}

export abstract class Expression extends Node {}
export abstract class Statement extends Node {}
