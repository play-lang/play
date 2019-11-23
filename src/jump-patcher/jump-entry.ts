/**
 * Represents the type of jump inside a context
 *
 * Jumps can either be by offset number (jump to specified code) or
 * jumps can go to the start of other contexts (contextual jumps)
 */
export enum JumpType {
	Offset = 1,
	Contextual,
}

/**
 * Represents a jump that must be patched at link time once all the contexts
 * are chained together into one big bytecode array
 */
export interface JumpEntry {
	/** Instruction offset of the jump to patch in its context */
	offset: number;
	/** The type of jump (jump to a context, or jump by offset number) */
	type: JumpType;
	/**
	 * Jump destination
	 *
	 * If a string, represents the context name to jump to for contextual jumps
	 *
	 * If a number, represents the instruction offset to jump to
	 */
	dest: string | number;
}
