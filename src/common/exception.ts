/**
 * Exception class
 *
 * Extend this class to enable your own custom classes to be throwable
 * (in Node or in the browser!)
 */
export class Exception extends Error {
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
}
