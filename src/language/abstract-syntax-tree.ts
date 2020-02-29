import { Environment } from "src/language/types/environment";
import { ProgramNode } from "src/parser/nodes/program-node";

/**
 * Represents an abstract syntax tree and related information
 * (the output of the parser)
 */
export class AbstractSyntaxTree {
	/** True if the tree has been verified by the type-checker */
	public verified: boolean = false;

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
