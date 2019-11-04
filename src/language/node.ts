import { Visitor } from "../parser/visitor/visitor";

export abstract class Node {
	public abstract accept(visitor: Visitor): any;
}

export abstract class Expression extends Node {}
export abstract class Statement extends Node {}
