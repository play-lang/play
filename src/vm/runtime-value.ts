import { RuntimeType } from "src/vm/runtime-type";

export class RuntimeValue {
	constructor(
		/** Runtime type */
		public readonly type: RuntimeType,
		/**
		 * Runtime value
		 * (number, string, boolean, or heap index number if the value is a pointer)
		 */
		public readonly value: any
	) {}

	/** True if the runtime value points to a value on the heap */
	public get isPointer(): boolean {
		return this.type === RuntimeType.Pointer;
	}

	/** Create a copy of the runtime value */
	public copy(): RuntimeValue {
		return new RuntimeValue(this.type, this.value);
	}
}
