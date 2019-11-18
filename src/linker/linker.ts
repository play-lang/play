import { Context } from "../language/context";
import { LoadedProgram } from "../language/loaded-program";
import { RuntimeValue } from "../vm/runtime-value";

// Multiple compiled "contexts" (one per function) need to be "linked"
// together into one context and jumps spanning between contexts
// need to be back-patched accordingly
export class Linker {
	constructor(
		public readonly contexts: Context[],
		public readonly constantPool: RuntimeValue[]
	) {}

	public link(): LoadedProgram {
		if (this.contexts.length < 1) {
			throw new Error("Must have at least 1 context");
		}
		if (this.contexts.length === 1) return this.contexts[0];
		let bytecode: number[] = [];
		for (const context of this.contexts) {
			bytecode = [...bytecode, ...context.bytecode];
		}

		return new LoadedProgram(this.constantPool, bytecode);
	}
}
