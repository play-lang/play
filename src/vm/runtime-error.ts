import { Exception } from "../common/exception";
import { Describable } from "../language/token";
import { VMStatus } from "./vm-status";

export class RuntimeError extends Exception implements Describable {
	constructor(public readonly code: VMStatus, message: string) {
		super(message);
	}

	/** Formatted runtime error description */
	public get description(): string {
		return this.message;
	}
}
