import { Context } from "src/language/context";
import { ContextLabels } from "src/language/context-labels";
import { LoadedProgram } from "src/language/loaded-program";
import { ObjectCode } from "src/language/object-code";
import { RuntimeValue } from "src/vm/runtime-value";

/**
 * Linker output creates a LinkedProgram, which is given to the Patcher
 * to back-patch jumps between contexts
 */
export class LinkedProgram implements ObjectCode {
	constructor(
		/** Constant pool preceding the code */
		public readonly constantPool: RuntimeValue[],
		/** Bytecode instructions, packed together */
		public readonly bytecode: number[],
		/**
		 * Number of local variables in the main scope (globals) to drop when the
		 * program is finished
		 */
		public readonly numGlobals: number,
		/** Array of all bytecode contexts in the linked program */
		public readonly contexts: Context[],
		/**
		 * Maps context names to their instruction start offset number in the
		 * linked bytecode
		 */
		public readonly contextMap: Map<string, number>,
		/** Jump patcher containing registered jump destinations */
		public readonly contextLabels: ContextLabels
	) {}

	/** Loaded program represented by the linker output */
	public get program(): LoadedProgram {
		return new LoadedProgram(
			this.constantPool,
			this.bytecode,
			this.numGlobals
		);
	}
}
