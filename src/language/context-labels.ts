import { Context } from "src/language/context";

/**
 * Holds a list of references to contexts amongst contexts
 */
export class ContextLabels {
	constructor(
		/** Map of contexts to the array of bytecode indices that need patching */
		public readonly addresses: Map<Context, number[]> = new Map(),
		/**
		 * Maps a context to a map of context names keyed by bytecode indices
		 * representing the context address to patch at that index
		 */
		public readonly labels: Map<
			Context,
			// Map of bytecode labels keyed by offset number
			Map<number, string>
		> = new Map()
	) {}

	/**
	 * Initializes the specified context so that addresses may be
	 * registered for it
	 * @param context The context to initialize
	 */
	public prepare(context: Context): void {
		if (this.addresses.has(context)) return;
		this.addresses.set(context, []);
		this.labels.set(context, new Map<number, string>());
	}

	/**
	 * Registers an address from the specified context to another
	 * context specified by its name (in case it hasn't been created yet)
	 *
	 * @param context The context registering the address
	 * @param index The instruction index of the address to be patched
	 * @param dest The name of the context the address refers to
	 * Since the name of the context can be predicted at write time this is
	 * sufficient for later patching since the context can be looked up by
	 * its name once it has actually been compiled
	 */
	public registerContextAddress(
		context: Context,
		index: number,
		dest: string
	): void {
		if (!this.addresses.has(context)) this.prepare(context);
		const addresses = this.addresses.get(context)!;
		const labels = this.labels.get(context)!;
		addresses.push(index);
		if (!labels.has(index)) {
			labels.set(index, dest);
		}
	}

	/**
	 * Patches the addresses registered for the specified bytecode
	 *
	 * Bytecode should be the final output from the linker
	 *
	 * Only call this when all contexts have been compiled for proper address
	 * back-patching!
	 *
	 * @param bytecode Combined bytecode of all the linked contexts
	 * @param contextMap Context names mapped to their start offset in
	 * the bytecode
	 * @param contexts An array of all the contexts used to create the
	 * linked bytecode
	 */
	public resolve(
		bytecode: number[],
		contexts: Context[],
		contextMap: Map<string, number>
	): void {
		// Go through each context used in the linked program and patch
		// the addresses inside
		for (const context of contexts) {
			// Find the base offset of the context containing the address
			const contextOffset: number = contextMap.get(context.name)!;
			const addresses = this.addresses.get(context)!;
			const labels = this.labels.get(context);
			if (!addresses || !labels) continue;
			for (const address of addresses) {
				const addressPos: number = contextOffset + address + 1;
				const label = labels.get(address)!;
				// Resolve address to a destination context
				if (!contextMap.has(label)) {
					throw new Error("Can't find destination context in linker output");
				}

				const destPos: number = contextMap.get(label)!;
				bytecode[addressPos] = destPos;
			} // for address of addresses
		} // contextName of contextMap.keys()
	}
}
