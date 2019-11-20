import { Context } from "./context";
import { LinkedProgram } from "./linked-program";

/**
 * Represents a jump between contexts--one that cannot be back-patched until
 * link time
 */
export class JumpInfo {
	public constructor(
		/** Index of the jump instruction to patch */
		public readonly offset: number,
		/**
		 * The jump's destination context
		 *
		 * When a jump occurs to a specified context after linking, the
		 * instruction pointer is set to the instruction at the start of where
		 * the context occurs in the unified bytecode
		 */
		public readonly destContextName: string
	) {}
}

/**
 * When jumping from one compiled bytecode "context" to another
 * (calling other functions), we need to construct jumps between contexts that
 * haven't been linked together into one bytecode array.
 *
 * Behold: The patch list! It stores locations of jumps and "labels" across
 * contexts and makes it easy to back-patch these jumps later on
 */
export class Patcher {
	constructor(
		/** Map of jumps for patching later */
		public readonly jumps: Map<Context, JumpInfo[]> = new Map()
	) {}

	/**
	 * Initializes the specified context so that labels and jumps may be
	 * registered for it
	 * @param context The context to initialize
	 */
	public prepare(context: Context): void {
		if (this.jumps.has(context)) return;
		this.jumps.set(context, []);
	}

	/**
	 * Registers a jump from the specified context to another context specified by
	 * its name (in case it hasn't been created yet)
	 *
	 * @param context The context to jump from
	 * @param jumpOffset The instruction offset of the jump so that it can be
	 * patched later
	 * @param destContextName The name of the context to jump to
	 * Since the name of the context can be predicted at jump time this is
	 * sufficient for later patching since the context can be looked up by
	 * its name
	 */
	public registerJump(
		context: Context,
		jumpOffset: number,
		destContextName: string
	): void {
		if (!this.jumps.has(context)) this.prepare(context);
		const jumps: JumpInfo[] = this.jumps.get(context)!;
		jumps.push(new JumpInfo(jumpOffset, destContextName)); // WHAT GOES HERE? The context may not have been compiled yet!
	}

	/**
	 * Patches the jumps registered for the specified context
	 *
	 * Only call this when all contexts have been compiled for proper jump
	 * back-patching!
	 *
	 * @param linkedProgram The combined program from the linker
	 * @param context The context to patch jumps in
	 */
	public patch(linkedProgram: LinkedProgram, context: Context): void {
		if (!this.jumps.has(context)) this.prepare(context);
		const jumps: JumpInfo[] = this.jumps.get(context)!;
		const bytecode: number[] = linkedProgram.program.bytecode;
		const contextMap: Map<string, number> = linkedProgram.contextMap;
		if (!contextMap.has(context.name)) {
			throw new Error("Can't find jump context in linker output");
		}
		const contextOffset: number = contextMap.get(context.name)!;
		for (const jump of jumps) {
			if (!contextMap.has(jump.destContextName)) {
				throw new Error("Can't find destination context in linker output");
			}
			const jumpPos: number = contextOffset + jump.offset + 1;
			const destPos: number = contextMap.get(jump.destContextName)!;
			bytecode[jumpPos] = destPos;
		}
	}
}
