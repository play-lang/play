import { Describable } from "src/common/describable";
import { VMType } from "src/vm/vm-type";

export class VMValue implements Describable {
	constructor(
		/** Runtime type */
		public readonly type: VMType,
		/**
		 * Runtime value
		 * (number, string, boolean, or heap index number if the value is a pointer)
		 */
		public readonly value: any
	) {}

	/** True if the runtime value points to a value on the heap */
	public get isPointer(): boolean {
		return this.type === VMType.Pointer;
	}

	/** Create a copy of the runtime value */
	public copy(): VMValue {
		return new VMValue(this.type, this.value);
	}

	// MARK: Describable

	public get description(): string {
		switch (this.type) {
			case VMType.Boolean:
				return this.value === true ? "true" : "false";
			case VMType.Number:
				return String(this.value);
			case VMType.String:
				return this.value;
			case VMType.Pointer:
				const ptr = this.value as number;
				return "&" + String(ptr);
		}
	}
}

// Make constants for zero values since they are so widely used
export const Nil: VMValue = new VMValue(VMType.Pointer, null);
export const Zero: VMValue = new VMValue(VMType.Number, 0);
export const Blank: VMValue = new VMValue(VMType.String, "");
export const True: VMValue = new VMValue(VMType.Boolean, true);
export const False: VMValue = new VMValue(VMType.Boolean, false);
