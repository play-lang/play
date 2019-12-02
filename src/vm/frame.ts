/**
 * Represents a stack frame for the virtual machine
 */
export class Frame {
	constructor(
		/** Instruction pointer */
		public ip: number,
		/** Bottom stack index for this frame */
		public basePointer: number,
		/** Number of locals to drop from stack when finished */
		public numLocals: number
	) {}
}
