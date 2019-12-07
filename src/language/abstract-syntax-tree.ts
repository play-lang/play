import { ProgramNode } from "../parser/nodes/program-node";
import { ActionInfo } from "./action-info";
import SymbolTable from "./symbol-table";

/**
 * Represents an abstract syntax tree and related information
 * (the output of the parser)
 */
export class AbstractSyntaxTree {
	constructor(
		public readonly root: ProgramNode,
		public readonly symbolTable: SymbolTable,
		public readonly actionTable: Map<string, ActionInfo>
	) {}

	public get json(): string {
		return JSON.stringify(this.root, null, "  ");
	}
}
