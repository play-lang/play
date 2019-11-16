import { VMStatus } from "./vm-status";
import { RuntimeValue } from "./runtime-value";

export class VMResult {
	constructor(
		/** Machine execution status */
		public readonly status: VMStatus,
		/** Final value returned */
		public readonly value: RuntimeValue
	) {}
}
