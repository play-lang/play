import { TypeCheckable } from "../type-checker/type-checkable";
import { TypeChecker } from "../type-checker/type-checker";
import { Visitor } from "./visitor";

export abstract class Node implements TypeCheckable {
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

	// MARK: TypeCheckable
	public get isAddressable(): boolean {
		return false;
	}

	public validate(tc: TypeChecker): void {}
}

export abstract class Expression extends Node {}
export abstract class Statement extends Node {}
