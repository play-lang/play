import { Context } from "src/language/context/context";
import { ContextLabels } from "src/language/context/context-labels";
import { VMValue } from "src/vm/vm-value";

/** Object code which can be disassembled */
export interface ObjectCode {
	/** List of contexts used in the program */
	contexts: Context[];
	/** List of constants used in the program */
	constantPool: VMValue[];
	/** Number of globals to clean up when program is finished */
	numGlobals: number;
	/** Bytecode instructions, packed together */
	bytecode?: number[];
	/**
	 * Maps context names to their instruction start offset number in the
	 * linked bytecode
	 */
	contextMap?: Map<string, number>;
	/** Mappings of context references inside the code */
	contextLabels?: ContextLabels;
}

export interface ExecutableProgram {
	/** Constant pool preceding the code */
	constantPool: VMValue[];
	/** Bytecode instructions, packed together */
	bytecode: number[];
	/**
	 * Number of local variables in the main scope (globals) to drop when the
	 * program is finished
	 */
	numGlobals: number;
}
