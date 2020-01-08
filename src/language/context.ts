import { OpCode } from "src/language/op-code";

/**
 * A chunk of bytecode, including literal data and source maps
 *
 * This represents a compiled piece of code (usually representing one function)
 * from the compiler
 */
export class Context {
	/** Source map: maps bytecode offsets to original source code positions */
	public readonly sourceMap: any = undefined;

	/** Map of bytecode instruction indices to label id's */
	public readonly labels: Map<number, number> = new Map();

	/** Index of the last instruction emitted */
	public lastInstr: number = -1;

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

	/**
	 * Emit a bytecode opcode and an optional parameter,
	 * returning the index of the last emitted byte
	 *
	 * @param opcode The instruction to emit
	 * @param param A numeric parameter, if any, to emit for the instruction
	 */
	public emit(opcode: OpCode, param?: number): number {
		if (typeof param !== "undefined") {
			this.bytecode.push(opcode, param);
			this.lastInstr = this.bytecode.length - 2;
		} else {
			this.bytecode.push(opcode);
			this.lastInstr = this.bytecode.length - 1;
		}
		return this.bytecode.length - 1;
	}

	public setLabel(ip: number, labelId: number): void {
		if (this.labels.has(ip)) return;
		this.labels.set(ip, labelId);
	}
}
