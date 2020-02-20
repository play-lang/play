import { FunctionInfo } from "src/language/function-info";
import { SymbolTable } from "src/language/symbol-table";
import { ModelType, ProtocolType } from "src/language/types/type-system";

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
		public readonly functionTable: Map<string, FunctionInfo>,
		public readonly protocols: Map<string, ProtocolType>,
		public readonly models: Map<string, ModelType>
	) {}
}
