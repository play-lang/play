import { CompiledProgram } from "../compiler/compiled-program";
import { LoadedProgram } from "../language/loaded-program";
import { LinkedProgram } from "./linked-program";

// Multiple compiled "contexts" (one per function) need to be "linked"
// together into one context and jumps spanning between contexts
// need to be back-patched accordingly
export class Linker {
	constructor(public readonly compiledProgram: CompiledProgram) {}

	public link(): LinkedProgram {
		const contexts = this.compiledProgram.contexts;
		const constantPool = this.compiledProgram.constantPool;
		// "Globals" are just locals in the "main" scope
		const numLocals = this.compiledProgram.numGlobals;
		// Map context names to their start instruction offset in the final
		// linked code
		const contextMap: Map<string, number> = new Map();
		if (contexts.length < 1) {
			throw new Error("Must have at least 1 context");
		}
		let bytecode: number[] = [];
		for (const context of contexts) {
			// Todo: The context map might be setting the wrong bytecode offset
			contextMap.set(context.name, bytecode.length);
			bytecode = [...bytecode, ...context.bytecode];
		}

		// Update and resolve all the addresses now that the bytecode
		// has been chained together
		this.compiledProgram.addressResolver.resolve(
			bytecode,
			contexts,
			contextMap
		);

		return new LinkedProgram(
			new LoadedProgram(constantPool, bytecode, numLocals),
			contexts,
			contextMap
		);
	}
}
