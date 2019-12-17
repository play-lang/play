import { ProgramNode } from "../parser/nodes/program-node";
import { Environment } from "./types/environment";

/**
 * Represents an abstract syntax tree and related information
 * (the output of the parser)
 */
export class AbstractSyntaxTree {
	constructor(
		public readonly root: ProgramNode,
		/**
		 * Type checking environment containing the resolved symbol table
		 * and function table which contain variable and function types,
		 * respectively
		 */
		public readonly env: Environment
	) {}

	public get json(): string {
		return JSON.stringify(this.root, null, "  ");
	}
}
