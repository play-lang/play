import { Type } from "../language/types/type-system";
import { TypeCheckable } from "../type-checker/type-checkable";
import { TypeChecker } from "../type-checker/type-checker";
import { AbstractSyntaxTree } from "./abstract-syntax-tree";
import { Visitor } from "./visitor";

export abstract class Node implements TypeCheckable {
	/** Type of the syntax tree node */
	public get nodeName(): string {
		return this.constructor.name;
	}

	constructor(
		/** Start index of the node in the source */
		public readonly start: number,
		/** End index of the node in the source */
		public readonly end: number
	) {}

	/** Type of the node for use with type checking */
	public abstract type(ast: AbstractSyntaxTree): Type;

	public abstract accept(visitor: Visitor): any;

	public abstract validate(tc: TypeChecker): void;
}

export abstract class Expression extends Node {}
export abstract class Statement extends Node {}
