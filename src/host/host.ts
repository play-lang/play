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
	 * The number of native functions provided (functions added after this in the
	 * function list are extension functions)
	 */
	public readonly numNativeFunctions: number;

	/**
	 *
	 * @param extendedFunctions Extension functions available to the virtual
	 * machine
	 */
	constructor(extendedFunctions: NativeFunction[]) {
		this.numNativeFunctions = nativeFunctions.length;
		this.functions = [...nativeFunctions, ...extendedFunctions];
	}
}
