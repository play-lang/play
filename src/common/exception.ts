import { Describable } from "src/common/describable";
import { TokenLike } from "src/language/token/token";

/**
 * Exception class
 *
 * Extend this class to enable your own custom classes to be throwable
 * (in Node or in the browser!)
 */
export class Exception extends Error implements Describable {
	/** Exception message */
	public readonly message: string;

	constructor(message: string) {
		super(message);

		// Restore prototype chain that is broken by the error object superclass
		// (thanks to weird node/browser implementations)
		const actualProto = new.target.prototype;
		if (Object.setPrototypeOf) {
			Object.setPrototypeOf(this, actualProto);
		} else {
			// tslint:disable-next-line
			(this as any).__proto__ = actualProto;
		}

		// Use our class name as our name.
		this.name = this.constructor.name;

		this.message = message;

		// Capture the stack at the time this was created:
		this.stack = new Error(this.message).stack;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	// MARK: Describable
	public get description(): string {
		return this.message;
	}
}

export class SemanticException extends Exception {
	constructor(
		/** Token where the error occurred */
		public readonly token: TokenLike,
		/** Semantic error message */
		public readonly message: string
	) {
		super(message);
	}
}
