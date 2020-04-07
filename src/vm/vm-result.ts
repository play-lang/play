import { VMError } from "src/vm/vm-error";
import { VMStatus } from "src/vm/vm-status";
import { VMValue } from "src/vm/vm-value";

export class VMResult {
	constructor(
		/** Machine execution status */
		public readonly status: VMStatus,
		/** Final value returned */
		public readonly value: VMValue,
		/** Execution time in milliseconds */
		public readonly duration: number,
		/** Specific error if `status` is not equal to `Success` */
		public readonly error?: VMError
	) {}
}
