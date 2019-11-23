import { JumpPatcher } from "../jump-patcher/jump-patcher";
import { Context } from "../language/context";
import { RuntimeValue } from "../vm/runtime-value";

export class CompiledProgram {
	constructor(
		/** List of contexts used in the program */
		public readonly contexts: Context[],
		/** List of constants used in the program */
		public readonly constantPool: RuntimeValue[],
		/** Jump patcher containing registered jump destinations */
		public readonly jumpPatcher: JumpPatcher
	) {}
}
