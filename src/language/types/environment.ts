import { FunctionInfo } from "src/language/function-info";
import { SymbolTable } from "src/language/symbol-table";

/**
 * Represents a type checking environment that contains the following
 * pieces of information:
 *
 * - Symbol Table
 * - Function Table containing information about every function
 */
export class Environment {
	constructor(
		/**
		 * Program symbol table (scope tree)
		 */
		public readonly symbolTable: SymbolTable,
		/** Function table of the type-checking environment */
		public readonly functionTable: Map<string, FunctionInfo>
	) {}
}
