import { Context } from "src/language/context";
import { ContextLabels } from "src/language/context-labels";
import { RuntimeValue } from "src/vm/runtime-value";

export interface ObjectCode {
	/** List of contexts used in the program */
	contexts: Context[];
	/** List of constants used in the program */
	constantPool: RuntimeValue[];
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
