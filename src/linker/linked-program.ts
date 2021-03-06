import { Context } from "src/language/context/context";
import { ContextLabels } from "src/language/context/context-labels";
import { ExecutableProgram, ObjectCode } from "src/language/program";
import { VMValue } from "src/vm/vm-value";

/**
 * Linker output creates a LinkedProgram, which is given to the Patcher
 * to back-patch jumps between contexts
 */
export class LinkedProgram implements ObjectCode, ExecutableProgram {
	constructor(
		/** Constant pool preceding the code */
		public readonly constantPool: VMValue[],
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
		/** Mappings of context references inside the code */
		public readonly contextLabels: ContextLabels
	) {}
}
