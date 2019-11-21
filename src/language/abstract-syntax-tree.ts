import { ActionDeclarationNode } from "../parser/nodes/action-declaration-node";
import { ProgramNode } from "../parser/nodes/program-node";
import SymbolTable from "./symbol-table";

/**
 * Represents an abstract syntax tree and related information
 * (the output of the parser)
 */
export class AbstractSyntaxTree {
	constructor(
		public readonly root: ProgramNode,
		public readonly symbolTable: SymbolTable,
		public readonly actionTable: Map<string, ActionDeclarationNode>
	) {}
}
