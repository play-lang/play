/**
 * Represents a bytecode address inside a context
 *
 * Addresses can either reference an offset number (to refer to
 * a specific piece of code in a given context)  or reference the
 * start of other contexts (contextual addresses)
 */
export enum BytecodeAddressType {
	Offset = 1,
	Contextual,
}

/**
 * Represents a jump that must be patched at link time once all the contexts
 * are chained together into one big bytecode array
 */
export interface BytecodeAddressEntry {
	/** Instruction offset of the jump to patch in its context */
	offset: number;
	/** The type of jump (jump to a context, or jump by offset number) */
	type: BytecodeAddressType;
	/**
	 * Jump destination
	 *
	 * If a string, represents the context name to jump to for contextual jumps
	 *
	 * If a number, represents the instruction offset to jump to
	 */
	dest: string | number;
}
