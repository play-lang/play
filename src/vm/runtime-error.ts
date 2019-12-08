import { Exception } from "../common/exception";
import { VMStatus } from "./vm-status";

export class RuntimeError extends Exception {
	constructor(public readonly code: VMStatus, message: string) {
		super(message);
	}
}
