import { RuntimeValue } from "src/vm/runtime-value";

export interface ExecutableProgram {
	/** Constant pool preceding the code */
	constantPool: RuntimeValue[];
	/** Bytecode instructions, packed together */
	bytecode: number[];
	/**
	 * Number of local variables in the main scope (globals) to drop when the
	 * program is finished
	 */
	numGlobals: number;
}
