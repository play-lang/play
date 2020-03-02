import { Host } from "src/host/host";
import { FunctionInfo } from "src/language/function-info";
import { Scope } from "src/language/scope";
import { SymbolTable } from "src/language/symbol-table";
import { Environment } from "src/language/types/environment";
import { ModelType, ProtocolType } from "src/language/types/type-system";

/**
 * Represents a Play source code module
 *
 * Modules can import and use other modules
 *
 * Source code for a given file declares what module it belongs to
 */
export class Module {
	public readonly env: Environment;

	constructor(
		/** Name of the module */
		public readonly name: string,
		host: Host
	) {
		this.env = new Environment(
			new SymbolTable(new Scope()),
			new Map<string, FunctionInfo>(),
			new Map<string, ProtocolType>(),
			new Map<string, ModelType>(),
			host
		);
	}
}
