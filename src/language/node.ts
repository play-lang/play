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

export abstract class Expression extends Node {}
export abstract class Statement extends Node {}
