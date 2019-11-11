import { RuntimeValue } from "../vm/runtime-value";

/** A chunk of bytecode, including literal data and source maps */
export class Context {
	/** Bytecode instructions, packed together */
	public readonly bytecode: number[] = [];
	/** Data table preceding the code containing literals */
	public readonly data: RuntimeValue[] = [];
	/** Source map: maps bytecode offsets to original source code positions */
	public readonly sourceMap: any = undefined;
	constructor() {}

	/**
	 * Create a new data literal and add it to the data section
	 * Returns the index to the literal data in the data section
	 * @param value The literal's runtime value
	 */
	public literal(value: RuntimeValue): number {
		this.data.push(value);
		return this.data.length - 1;
	}
}
