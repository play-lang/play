import { Describable } from "../language/token";
import { Exception } from "../common/exception";
import { VMResult } from "./vm-result";

export class RuntimeError extends Exception implements Describable {
	constructor(public readonly code: VMResult, message: string) {
		super(message);
	}

	/** Formatted runtime error description */
	public get description(): string {
		return this.message;
	}
}
