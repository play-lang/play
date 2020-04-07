import { VirtualMachine } from "src/vm/virtual-machine";
import { VMType } from "src/vm/vm-type";
import { Nil, VMValue } from "src/vm/vm-value";

export abstract class NativeFunction {
	constructor(
		/** Number of arguments required */
		public readonly arity: number = 0,
		/** Whether or not the function will return a value */
		public readonly hasReturnValue: boolean = false,
		/** True if the function is a method that expects `this` to be given */
		public readonly expectsReceiver: boolean = false
	) {}

	/**
	 * Execute the native function with the specified arguments
	 * @param vm The virtual machine invoking the function
	 * @param args Function arguments
	 * @param receiver The `this` context of the method being invoked, if
	 * `expectsReceiver` is `true`
	 *
	 * This value will always be provided if `expectsReceiver` is true and never
	 * provided otherwise
	 * @returns Any runtime value if `hasReturnValue` is `true`
	 *
	 * Functions where `hasReturnValue` is `true` must return a value
	 */
	public abstract execute(
		vm: VirtualMachine,
		args: VMValue[],
		receiver?: VMValue
	): VMValue | undefined;
}

export class ListPush extends NativeFunction {
	constructor() {
		super(1, true, true);
	}
	public execute(
		vm: VirtualMachine,
		args: VMValue[],
		context?: VMValue
	): VMValue | undefined {
		// Trigger gc read barrier
		const addr = vm.gc.read(context!.value as number);
		// Push the item into the list
		(vm.gc.toSpace[addr].values.data as VMValue[]).push(args[0]);
		// Return the new length
		return new VMValue(VMType.Number, vm.gc.toSpace[addr].values.length);
	}
}

export class ListPop extends NativeFunction {
	constructor() {
		super(0, true, true);
	}
	public execute(
		vm: VirtualMachine,
		args: VMValue[],
		context?: VMValue
	): VMValue | undefined {
		// Trigger gc read barrier
		const addr = vm.gc.read(context!.value as number);
		// Pop item and return it
		return (vm.gc.toSpace[addr].values.data as VMValue[]).pop() || Nil;
	}
}

export class ListUnshift extends NativeFunction {
	constructor() {
		super(1, true, true);
	}
	public execute(
		vm: VirtualMachine,
		args: VMValue[],
		context?: VMValue
	): VMValue | undefined {
		// Trigger gc read barrier
		const addr = vm.gc.read(context!.value as number);
		// Unshift the item into the list
		(vm.gc.toSpace[addr].values.data as VMValue[]).unshift(args[0]);
		// Return the new length
		return new VMValue(VMType.Number, vm.gc.toSpace[addr].values.length);
	}
}

export class ListShift extends NativeFunction {
	constructor() {
		super(0, true, true);
	}
	public execute(
		vm: VirtualMachine,
		args: VMValue[],
		context?: VMValue
	): VMValue | undefined {
		// Trigger gc read barrier
		const addr = vm.gc.read(context!.value as number);
		// Shift item and return it
		return (vm.gc.toSpace[addr].values.data as VMValue[]).shift() || Nil;
	}
}

/** Native functions built into the Play language */
export const nativeFunctions: NativeFunction[] = [
	new ListPush(),
	new ListPop(),
	new ListUnshift(),
	new ListShift(),
];
