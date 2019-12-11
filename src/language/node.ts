import { TypeCheckable } from "../type-checker/type-checkable";
import { TypeChecker } from "../type-checker/type-checker";
import { TypeRule } from "./type-system";
import { Visitor } from "./visitor";

export abstract class Node {
	constructor(
		/** Start index of the node in the source */
		public readonly start: number,
		/** End index of the node in the source */
		public readonly end: number
	) {}
	public abstract accept(visitor: Visitor): any;

	/** Type of the syntax tree node */
	public get type(): string {
		return this.constructor.name;
	}
}

export abstract class Expression extends Node implements TypeCheckable {
	public abstract get isAddressable(): boolean;
	public abstract validate(tc: TypeChecker): void;
	public abstract computeReturnType(tc: TypeChecker): TypeRule;
}

export abstract class Statement extends Node {}
