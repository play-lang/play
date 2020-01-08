import { Context } from "src/language/context";
import { RuntimeValue } from "src/vm/runtime-value";

export interface ObjectCode {
	/** List of contexts used in the program */
	contexts: Context[];
	/** Bytecode instructions, packed together */
	bytecode?: number[];
	/** List of constants used in the program */
	constantPool: RuntimeValue[];
	/** Number of globals to clean up when program is finished */
	numGlobals: number;
	/**
	 * Maps context names to their instruction start offset number in the
	 * linked bytecode
	 */
	contextMap?: Map<string, number>;
}
