import { FunctionInfo } from "src/language/function-info";
import { SymbolTable } from "src/language/symbol-table";

export class Environment {
	constructor(
		/** Symbol table for use in the type-checking environment */
		public readonly symbolTable: SymbolTable,
		/** Function table for use in the type-checking environment */
		public readonly functionTable: Map<string, FunctionInfo>
	) {}
}
