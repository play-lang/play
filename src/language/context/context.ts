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
	public indexLastInstr: number = 0;

	/** The last instruction */
	public get lastInstr(): number {
		return this.bytecode[this.indexLastInstr];
	}

	constructor(
		/** Context name */
		public readonly name: string,
		/**
		 * Number of local variables in this context to drop when the context
		 * is exited
		 */
		public readonly numLocals: number,
		/** Bytecode instructions, packed together */
		public readonly bytecode: number[],
		/**
		 * Label identifier used for the context to keep it unique among
		 * local labels inside the contexts for pretty disassembler output
		 */
		public readonly labelId: number
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
			this.indexLastInstr = this.bytecode.length - 2;
		} else {
			this.bytecode.push(opcode);
			this.indexLastInstr = this.bytecode.length - 1;
		}
		return this.bytecode.length - 1;
	}

	/**
	 * Output a label at the last instruction and return the index of the
	 * last instruction
	 * @returns Index of the last instruction
	 */
	public emitLabel(labelId: number): number {
		this.setLabel(this.bytecode.length, labelId);
		return this.bytecode.length;
	}

	/**
	 * Mark a particular instruction address as a label
	 *
	 * @param ip The instruction pointer to the address represented by
	 * the label
	 * @param labelId A globally unique number representing the label id
	 */
	public setLabel(ip: number, labelId: number): void {
		if (this.labels.has(ip)) return;
		this.labels.set(ip, labelId);
	}

	/** Emit an unconditional jump instruction to be patched later */
	public jump(): number {
		return this.emit(OpCode.Jmp, 0);
	}

	/** Emit a jump-if-false instruction to be patched later */
	public jumpIfFalse(): number {
		return this.emit(OpCode.JmpFalse, 0);
	}

	/** Emit a jump-if-true instruction to be patched later */
	public jumpIfTrue(): number {
		return this.emit(OpCode.JmpTrue, 0);
	}

	/** Emit a jump-if-false (and pop) instruction to be patched later */
	public jumpIfFalseAndPop(): number {
		return this.emit(OpCode.JmpFalsePop, 0);
	}

	/** Emit a jump-if-true (and pop) instruction to be patched later */
	public jumpIfTrueAndPop(): number {
		return this.emit(OpCode.JmpTruePop, 0);
	}

	/**
	 * Jump backwards by an offset amount
	 * @param dest The loop destination as an offset to the current ip
	 */
	public loop(dest: number): number {
		return this.emit(OpCode.Loop, dest);
	}
}
