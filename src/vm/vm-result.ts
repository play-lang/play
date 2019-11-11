/** Interpreter program result statuses */
export enum VMResult {
	/** Program ran successfully */
	Success,
	/** Interpreter caught an unexpected exception */
	UnknownFailure,
	/** Attempted to pop a value from the stack when the stack was empty */
	StackUnderflow,
}
