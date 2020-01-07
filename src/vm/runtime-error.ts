import { Exception } from "src/common/exception";
import { VMStatus } from "src/vm/vm-status";

export class RuntimeError extends Exception {
	constructor(public readonly code: VMStatus, message: string) {
		super(message);
	}
}
