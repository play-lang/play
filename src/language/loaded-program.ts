import { RuntimeValue } from "../vm/runtime-value";

export class LoadedProgram {
	constructor(
		/** Constant pool preceding the code */
		public readonly constantPool: RuntimeValue[],
		/** Bytecode instructions, packed together */
		public readonly bytecode: number[]
	) {}
}
