import { RuntimeType } from "src/vm/runtime-type";

export class RuntimeValue {
	constructor(
		/** Runtime type */
		public readonly type: RuntimeType,
		/** Runtime value (number, string, boolean, object, function) */
		public readonly value: any
	) {}
}
