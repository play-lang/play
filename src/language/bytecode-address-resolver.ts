import {
	BytecodeAddressEntry,
	BytecodeAddressType,
} from "./bytecode-address-entry";
import { Context } from "./context";

/**
 * When jumping from one compiled bytecode "context" to another
 * (calling other functions), we need to construct jumps between contexts that
 * haven't been linked together into one bytecode array.
 *
 * This stores locations of jumps and "labels" across
 * contexts and makes it easy to back-patch these jumps later on
 *
 * It effectively can store any kind of bytecode address that needs to be
 * resolved at link time
 *
 * For instance, besides just being used for link-time jump resolution, it is
 * also used to resolve function addresses when a function is loaded with LOAD
 */
export class BytecodeAddressResolver {
	constructor(
		/** Map of addresses for patching later */
		public readonly addresses: Map<Context, BytecodeAddressEntry[]> = new Map()
	) { }

	/**
	 * Initializes the specified context so that addresses may be
	 * registered for it
	 * @param context The context to initialize
	 */
	public prepare(context: Context): void {
		if (this.addresses.has(context)) return;
		this.addresses.set(context, []);
	}

	/**
	 * Registers an address from the specified context to another
	 * context specified by its name (in case it hasn't been created yet)
	 *
	 * @param context The context registering the address
	 * @param offset The instruction offset of the address to be patched
	 * @param dest The name of the context the address refers to
	 * Since the name of the context can be predicted at write time this is
	 * sufficient for later patching since the context can be looked up by
	 * its name once it has actually been compiled
	 */
	public registerContextAddress(
		context: Context,
		offset: number,
		dest: string
	): void {
		if (!this.addresses.has(context)) this.prepare(context);
		const addresses = this.addresses.get(context)!;
		addresses.push(new BytecodeAddressEntry(
			offset,
			BytecodeAddressType.Contextual,
			dest,
		));
	}

	/**
	 * Registers an address from a given offset in a single context to another
	 * bytecode offset inside the same context
	 * context
	 * @param context The context containing the address
	 * @param offset The instruction offset of the address to patch
	 * @param dest The offset inside the context to point to
	 */
	public registerAddress(context: Context, offset: number, dest: number): void {
		if (!this.addresses.has(context)) this.prepare(context);
		const addresses = this.addresses.get(context)!;
		addresses.push(new BytecodeAddressEntry(
			offset,
			BytecodeAddressType.Offset,
			dest,
		));
	}

	/**
	 * Patches the addresses registered for the specified bytecode
	 *
	 * Bytecode should be the final output from the linker
	 *
	 * Only call this when all contexts have been compiled for proper address
	 * back-patching!
	 *
	 * @param bytecode All of the bytecode from all of the linked contexts
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
			const addresses = this.addresses.get(context);
			if (!addresses) continue;
			for (const address of addresses) {
				const addressPos: number = contextOffset + address.offset + 1;
				if (address.type === BytecodeAddressType.Contextual) {
					// Resolve address to a destination context
					if (!contextMap.has(address.dest as string)) {
						throw new Error("Can't find destination context in linker output");
					}

					const destPos: number = contextMap.get(address.dest as string)!;
					bytecode[addressPos] = destPos;
				} else if (address.type === BytecodeAddressType.Offset) {
					// Resolve address within a context
					const destPos: number = contextOffset + (address.dest as number);
					bytecode[addressPos] = destPos;
				}
			} // for address of addresses
		} // contextName of contextMap.keys()
	}
}
