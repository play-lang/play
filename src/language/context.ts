import { RuntimeValue } from "../vm/runtime-value";
import { LoadedProgram } from "./loaded-program";

/**
 * A chunk of bytecode, including literal data and source maps
 *
 * This represents a compiled piece of code (usually representing one function)
 * from the compiler
 */
export class Context extends LoadedProgram {
	public readonly name: string;
	/**
	 * Maps constant values to their index in the constant pool to prevent duplicate entries
	 */
	public readonly constants: Map<any, number>;
	/** Source map: maps bytecode offsets to original source code positions */
	public readonly sourceMap: any = undefined;

	constructor(
		name: string,
		constantPool: RuntimeValue[],
		constants: Map<any, number>
	) {
		super(constantPool, []);
		this.name = name;
		this.constants = constants;
	}

	/**
	 * Creates a new data constant for a literal and adds it to the
	 * constant pool
	 *
	 * @returns The index to the constant in the constant pool
	 * @param value The constant's runtime value
	 */
	public constant(value: RuntimeValue): number {
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
