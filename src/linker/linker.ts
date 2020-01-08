import { CompiledProgram } from "src/compiler/compiled-program";
import { LinkedProgram } from "src/linker/linked-program";

// Multiple compiled "contexts" (one per function) need to be "linked"
// together into one context and jumps spanning between contexts
// need to be back-patched accordingly
export class Linker {
	/**
	 * Links the compiled bytecode contexts contained in the compiled program
	 * together to result in one final, combined bytecode sequence
	 * @param program The compiled program
	 */
	public link(program: CompiledProgram): LinkedProgram {
		const contexts = program.contexts;
		const constantPool = program.constantPool;
		// "Globals" are just locals in the "main" scope
		const numLocals = program.numGlobals;
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
		program.contextLabels.resolve(bytecode, contexts, contextMap);

		return new LinkedProgram(
			constantPool,
			bytecode,
			numLocals,
			contexts,
			contextMap,
			program.contextLabels
		);
	}
}
