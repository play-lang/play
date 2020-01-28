import { RuntimeValue } from "src/vm/runtime-value";
import { VMStatus } from "src/vm/vm-status";

export class VMResult {
	constructor(
		/** Machine execution status */
		public readonly status: VMStatus,
		/** Final value returned */
		public readonly value: RuntimeValue,
		/** Execution time in milliseconds */
		public readonly duration: number
	) {}
}
