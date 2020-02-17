import { RuntimeValue } from "src/vm/runtime-value";

/**
 * Represents data that is stored in a heap cell
 *
 * Data can be represented in a heap cell as an array or a map and this poses
 * as a common iterable interface to either so that the garbage collector need
 * not care about what kind of data a cell is storing (it only needs to be
 * able to iterate through and update the data while scanning pointers)
 *
 * This is a simple abstraction that makes the code for the garbage collector
 * a little bit cleaner and easier to maintain
 */
export class CellData implements Iterable<[string | number, RuntimeValue]> {
	constructor(
		public readonly data: RuntimeValue[] | Map<string, RuntimeValue>
	) {}

	public [Symbol.iterator](): Iterator<
		[string | number, RuntimeValue],
		any,
		undefined
	> {
		return this.iterator();
	}

	public *iterator(): Iterator<
		[string | number, RuntimeValue],
		any,
		undefined
	> {
		// Iterate through the underlying array or map accordingly
		switch (true) {
			case Array.isArray(this.data): {
				const data = this.data as RuntimeValue[];
				for (let i = 0; i < data.length; i++) {
					yield [i, data[i]];
				}
				break;
			}
			case this.data instanceof Map: {
				const data = this.data as Map<string, RuntimeValue>;
				for (const [key, value] of data) {
					return [key, value];
				}
				break;
			}
		}
	}

	/** Update a value in the underlying array or map */
	public update(key: string | number, value: RuntimeValue): void {
		switch (true) {
			case Array.isArray(this.data):
				(this.data as RuntimeValue[])[key as number] = value;
				break;
			case this.data instanceof Map:
				(this.data as Map<string, RuntimeValue>).set(key as string, value);
				break;
		}
	}

	/** Get a value from the underlying array or map */
	public get(key: string | number): RuntimeValue | undefined {
		switch (true) {
			case Array.isArray(this.data):
				return (this.data as RuntimeValue[])[key as number];
			case this.data instanceof Map:
				return (this.data as Map<string, RuntimeValue>).get(key as string);
		}
	}

	/** Length/size of the underlying array or map */
	public get length(): number {
		switch (true) {
			default:
			case Array.isArray(this.data):
				return (this.data as RuntimeValue[]).length;
			case this.data instanceof Map:
				return (this.data as Map<string, RuntimeValue>).size;
		}
	}
}
