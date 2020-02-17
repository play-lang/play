import { RuntimeValue } from "src/vm/runtime-value";

/**
 * Represents data stored in a heap cell
 *
 * Data can be represented in a cell as an array or a map and this poses as
 * a common iterable interface to either so that the garbage collector need
 * not care about what kind of data a cell is storing (it only needs to be
 * able to iterate through the data to scan for pointers)
 *
 * I'm not super proud of this duktape, but it gets the job done
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
			// case this.data instanceof Set: {
			// 	const data = this.data as Set<RuntimeValue>;
			// 	for (const value of data) {
			// 		return [value, value];
			// 	}
			// 	break;
			// }
		}
	}

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

	public get(key: string | number): RuntimeValue | undefined {
		switch (true) {
			case Array.isArray(this.data):
				return (this.data as RuntimeValue[])[key as number];
			case this.data instanceof Map:
				return (this.data as Map<string, RuntimeValue>).get(key as string);
		}
	}

	public get length(): number {
		switch (true) {
			default:
			case Array.isArray(this.data):
				return (this.data as RuntimeValue[]).length;
			case this.data instanceof Map:
				return (this.data as Map<string, RuntimeValue>).size;
			// case this.data instanceof Set:
			// 	return (this.data as Set<RuntimeValue>).size;
		}
	}
}
