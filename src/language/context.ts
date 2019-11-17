import { RuntimeValue } from "../vm/runtime-value";

/** A chunk of bytecode, including literal data and source maps */
export class Context {
	/** Bytecode instructions, packed together */
	public readonly bytecode: number[] = [];
	/** Constant pool preceding the code */
	public readonly constantPool: RuntimeValue[];
	/**
	 * Maps constant values to their index in the constant pool to prevent duplicate entries
	 */
	public readonly constants: Map<any, number>;
	/** Source map: maps bytecode offsets to original source code positions */
	public readonly sourceMap: any = undefined;

	constructor(constantPool: RuntimeValue[], constants: Map<any, number>) {
		this.constantPool = constantPool;
		this.constants = constants;
	}

	/**
	 * Create a new data literal and add it to the data section
	 * Returns the index to the literal data in the data section
	 * @param value The literal's runtime value
	 */
	public literal(value: RuntimeValue): number {
		if (this.constants.has(value.value)) {
			return this.constants.get(value.value)!;
		} else {
			// Unique, new constant
			this.constantPool.push(value);
			this.constants.set(value.value, this.constantPool.length - 1);
			return this.constantPool.length - 1;
		}
	}
}
