import { SymbolTable } from "src/language/symbol-table";
import { Environment } from "src/language/types/environment";

/**
 * Represents a Play source code module
 *
 * Modules can import and use other modules
 *
 * Source code for a given file declares what module it belongs to
 */
export class Module {
	public readonly env: Environment = new Environment(
		new SymbolTable(new Scope()),
		new Map<string, FunctionInfo>(),
		new Map<string, ProtocolType>(),
		new Map<string, ModelType>(),
		new Host()
	);
	constructor() {}
}
