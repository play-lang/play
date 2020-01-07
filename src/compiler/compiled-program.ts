import { BytecodeAddressResolver } from "src/assembler/bytecode-address-resolver";
import { Context } from "src/language/context";
import { RuntimeValue } from "src/vm/runtime-value";

export class CompiledProgram {
	constructor(
		/** List of contexts used in the program */
		public readonly contexts: Context[],
		/** List of constants used in the program */
		public readonly constantPool: RuntimeValue[],
		/** Number of globals to clean up when program is finished */
		public readonly numGlobals: number,
		/** Jump patcher containing registered jump destinations */
		public readonly addressResolver: BytecodeAddressResolver
	) {}
}
