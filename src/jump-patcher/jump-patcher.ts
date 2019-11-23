import { Context } from "../language/context";
import { JumpEntry, JumpType } from "./jump-entry";

/**
 * When jumping from one compiled bytecode "context" to another
 * (calling other functions), we need to construct jumps between contexts that
 * haven't been linked together into one bytecode array.
 *
 * This is nothing like a real assembler. If anything, it's more like a linker
 * Except, the play linker simply tapes things together. It doesn't
 * resolve jumps like this does
 *
 * This stores locations of jumps and "labels" across
 * contexts and makes it easy to back-patch these jumps later on
 */
export class JumpPatcher {
	constructor(
		/** Map of jumps for patching later */
		public readonly jumps: Map<Context, JumpEntry[]> = new Map()
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
	 * @param offset The instruction offset of the jump to patch
	 * @param dest The name of the context to jump to
	 * Since the name of the context can be predicted at jump time this is
	 * sufficient for later patching since the context can be looked up by
	 * its name
	 */
	public registerContextJump(
		context: Context,
		offset: number,
		dest: string
	): void {
		if (!this.jumps.has(context)) this.prepare(context);
		const jumps = this.jumps.get(context)!;
		jumps.push({
			offset,
			type: JumpType.Contextual,
			dest,
		});
	}

	/**
	 * Registers a jump from a context to another position inside the same
	 * context
	 * @param context The context containing the jump
	 * @param offset The instruction offset of the jump to patch
	 * @param dest The offset inside the context to jump to
	 */
	public registerJump(context: Context, offset: number, dest: number): void {
		if (!this.jumps.has(context)) this.prepare(context);
		const jumps = this.jumps.get(context)!;
		jumps.push({
			offset,
			type: JumpType.Offset,
			dest,
		});
	}

	/**
	 * Patches the jumps registered for the specified bytecode
	 *
	 * Bytecode should be the final output from the linker
	 *
	 * Only call this when all contexts have been compiled for proper jump
	 * back-patching!
	 *
	 * @param bytecode All of the bytecode from all of the linked contexts
	 * @param contextMap Context names mapped to their start offset in
	 * the bytecode
	 * @param contexts An array of all the contexts used to create the
	 * linked bytecode
	 */
	public patch(
		bytecode: number[],
		contexts: Context[],
		contextMap: Map<string, number>
	): void {
		// Go through each context used in the linked program and patch
		// the jumps inside
		for (const context of contexts) {
			// Find the base offset of the context containing the jump
			const contextOffset: number = contextMap.get(context.name)!;
			const jumps = this.jumps.get(context);
			if (!jumps) continue;
			for (const jump of jumps) {
				const jumpPos: number = contextOffset + jump.offset + 1;
				if (jump.type === JumpType.Contextual) {
					// Jump to a destination context
					if (!contextMap.has(jump.dest as string)) {
						throw new Error("Can't find destination context in linker output");
					}

					const destPos: number = contextMap.get(jump.dest as string)!;
					bytecode[jumpPos] = destPos;
				} else if (jump.type === JumpType.Offset) {
					// Jump within a context
					const destPos: number = contextOffset + (jump.dest as number);
					bytecode[jumpPos] = destPos;
				}
			} // for jump of jumps
		} // contextName of contextMap.keys()
	}
}
