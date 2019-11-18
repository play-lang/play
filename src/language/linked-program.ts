import { LoadedProgram } from "./loaded-program";

/**
 * Linker output creates a LinkedProgram, which is given to the Patcher
 * to back-patch jumps between contexts
 */
export class LinkedProgram {
	constructor(
		/**
		 * The loaded program containing the constant pool and combined
		 * bytecode instructions of all of the contexts used to create
		 * the program
		 */
		public readonly program: LoadedProgram,
		/**
		 * Maps context names from the contexts used to create the linked
		 * program to their start offset number in the linked bytecode
		 */
		public readonly contextMap: Map<string, number>
	) {}
}
