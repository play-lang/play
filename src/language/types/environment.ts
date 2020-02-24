import { Host } from "src/host/host";
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
		/** Symbol table of the type-checking environment (context) */
		public readonly symbolTable: SymbolTable,
		/** Function table of the type-checking environment (signatures) */
		public readonly functionTable: Map<string, FunctionInfo>,
		/** Protocols visible in the environment */
		public readonly protocols: Map<string, ProtocolType>,
		/** Models visible in the environment */
		public readonly models: Map<string, ModelType>,
		/** Native extensions provided by the host for the environment */
		public readonly host: Host
	) {}
}
