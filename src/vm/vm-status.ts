/** Interpreter program result statuses */
export enum VMStatus {
	/** Program ran successfully */
	Success,
	/** Interpreter caught an unexpected exception */
	UnknownFailure,
	/** Attempted to pop a value from the stack when the stack was empty */
	StackUnderflow,
	/** Bad stack operand(s) */
	InvalidOperands,
	/** Invalid instruction (from bad bytecode) */
	InvalidInstruction,
}
