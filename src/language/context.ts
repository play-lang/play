/**
 * A chunk of bytecode, including literal data and source maps
 *
 * This represents a compiled piece of code (usually representing one function)
 * from the compiler
 */
export class Context {
	/** Source map: maps bytecode offsets to original source code positions */
	public readonly sourceMap: any = undefined;

	constructor(
		/** Context name */
		public readonly name: string,
		/**
		 * Number of local variables in this context to drop when the context
		 * is exited
		 */
		public readonly numLocals: number,
		/** Bytecode instructions, packed together */
		public readonly bytecode: number[]
	) {}
}
