import { Describable } from "src/common/describable";
import { RuntimeType } from "src/vm/runtime-type";

export class RuntimeValue implements Describable {
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

	// MARK: Describable

	public get description(): string {
		switch (this.type) {
			case RuntimeType.Boolean:
				return this.value === true ? "true" : "false";
			case RuntimeType.Number:
				return String(this.value);
			case RuntimeType.String:
				return this.value;
			case RuntimeType.Pointer:
				const ptr = this.value as number;
				return "&" + String(ptr);
		}
	}
}
