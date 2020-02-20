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
	/** Failed to allocate more data on the heap */
	AllocationFailed,
	/** Invalid index operation into a non lhs-type */
	InvalidIndexOperation,
	/** Invalid index into a collection */
	InvalidIndex,
	/** Not an even number of map keys and values on the stack */
	UnevenMap,
	/** Invalid map key (not a string) */
	InvalidMapKey,
}
