import { nativeFunctions, NativeFunction } from "src/host/native-functions";

/**
 * Represents a virtual machine host which contains information about
 * native and extension functions
 *
 * Native functions are built-in by the virtual machine and are a part of the
 * Play programming language
 *
 * Extension functions are provided by the host environment utilizing the
 * Play virtual machine with the extensions api's
 */
export class Host {
	/** Functions that can be executed by the virtual machine */
	public readonly functions: NativeFunction[];
	/**
	 * The number of functions that play provides by default
	 *
	 * Functions beginning at this index in `functions` are the additional native
	 * functions provided to the host in addition to the ones that Play provides
	 * by default
	 */
	public readonly numBuiltInFunctions: number;

	/**
	 * Create a new play runtime environment host
	 * @param extendedFunctions Additional native functions to add to the host
	 * environment besides the ones that Play provides by default
	 */
	constructor(extendedFunctions: NativeFunction[] = []) {
		this.numBuiltInFunctions = nativeFunctions.length;
		this.functions = [...nativeFunctions, ...extendedFunctions];
	}
}
