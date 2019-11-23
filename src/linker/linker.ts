import { Context } from "../language/context";
import { LoadedProgram } from "../language/loaded-program";
import { RuntimeValue } from "../vm/runtime-value";
import { LinkedProgram } from "./linked-program";

// Multiple compiled "contexts" (one per function) need to be "linked"
// together into one context and jumps spanning between contexts
// need to be back-patched accordingly
export class Linker {
	constructor(
		public readonly contexts: Context[],
		public readonly constantPool: RuntimeValue[]
	) {}

	public link(): LinkedProgram {
		// Map context names to their start instruction offset in the final
		// linked code
		const contextMap: Map<string, number> = new Map();
		if (this.contexts.length < 1) {
			throw new Error("Must have at least 1 context");
		}
		let bytecode: number[] = [];
		for (const context of this.contexts) {
			contextMap.set(context.name, bytecode.length - 1);
			bytecode = [...bytecode, ...context.bytecode];
		}

		return new LinkedProgram(
			new LoadedProgram(this.constantPool, bytecode),
			this.contexts,
			contextMap
		);
	}
}
