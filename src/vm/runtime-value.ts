import { RuntimeType } from "./runtime-type";

export class RuntimeValue {
	constructor(
		public readonly type: RuntimeType,
		public readonly value: any
	) {}
}
