/**
 * Represents a runtime pointer value
 *
 * An instance of RuntimePointer can be supplied as a value to a RuntimeValue
 */
export class RuntimePointer {
	constructor(
		/** True if the pointer points into to-space, false otherwise */
		public readonly toSpace: boolean,
		/** The address in the relevant space the pointer points to */
		public readonly addr: number | undefined
	) {}
}
