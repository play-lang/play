import { BytecodeAddressResolver } from "../jump-patcher/address-resolver";
import { Context } from "../language/context";
import { RuntimeValue } from "../vm/runtime-value";

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
