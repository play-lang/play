import { ProgramNode } from "../parser/nodes/program-node";
import { FunctionInfo } from "./function-info";
import { SymbolTable } from "./symbol-table";

/**
 * Represents an abstract syntax tree and related information
 * (the output of the parser)
 */
export class AbstractSyntaxTree {
	constructor(
		public readonly root: ProgramNode,
		public readonly symbolTable: SymbolTable,
		public readonly functionTable: Map<string, FunctionInfo>
	) {}

	public get json(): string {
		return JSON.stringify(this.root, null, "  ");
	}
}
