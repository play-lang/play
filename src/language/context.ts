import { RuntimeValue } from "../interpreter/runtime-value";

/** A chunk of bytecode, including literal data and source maps */
export class Context {
	/** Bytecode instructions, packed together */
	public readonly bytecode: number[] = [];
	/** Data table preceding the code containing literals */
	public readonly data: RuntimeValue[] = [];
	/** Source map: maps bytecode offsets to original source code positions */
	public readonly sourceMap: any = undefined;
	constructor() {}

	// Create a bytecode statement
	public gen(opCode: number): void {
		this.bytecode.push(opCode);
	}
}
