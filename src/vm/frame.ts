/**
 * Represents a stack frame for the virtual machine
 */
export class Frame {
	constructor(
		/** Instruction pointer */
		public readonly ip: number
	) {}
}
