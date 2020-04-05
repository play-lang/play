import { Context } from "src/language/context/context";
import { ContextLabels } from "src/language/context/context-labels";
import { ObjectCode } from "src/language/program";
import { RuntimeValue } from "src/vm/runtime-value";

export class CompiledProgram implements ObjectCode {
	constructor(
		/** List of contexts used in the program */
		public readonly contexts: Context[],
		/** List of constants used in the program */
		public readonly constantPool: RuntimeValue[],
		/** Number of globals to clean up when program is finished */
		public readonly numGlobals: number,
		/** Mappings of context references inside the code */
		public readonly contextLabels: ContextLabels
	) {}
}
