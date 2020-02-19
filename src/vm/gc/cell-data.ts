import { RuntimeValue } from "src/vm/runtime-value";

/** Underlying type represented by the cell data */
export type CellDataType =
	| RuntimeValue[]
	| Map<string, RuntimeValue>
	| Set<RuntimeValue>;

/** Type of key used by the underlying data type */
export type CellDataTypeKey = string | number | RuntimeValue;

/**
 * Represents data that is stored in a heap cell
 *
 * Data can be represented in a heap cell as an array, map, or set and this
 * poses as a common iterable interface to either so that the garbage collector
 * need not care about what kind of data a cell is storing (it only needs to be
 * able to iterate through the data and update child pointers)
 *
 * This is a simple abstraction (using ES-6 JavaScript magic) that makes the
 * code for the garbage collector a little bit cleaner and easier to maintain
 */
export class CellData {
	constructor(public readonly data: CellDataType) {}

	public *keys(): IterableIterator<CellDataTypeKey> {
		// Iterate through the underlying array or map accordingly
		switch (true) {
			case Array.isArray(this.data): {
				const data = this.data as RuntimeValue[];
				for (let i = 0; i < data.length; i++) {
					yield i;
				}
				break;
			}
			case this.data instanceof Map: {
				const data = this.data as Map<string, RuntimeValue>;
				for (const key of data.keys()) {
					yield key;
				}
				break;
			}
			case this.data instanceof Set: {
				const data = this.data as Set<RuntimeValue>;
				for (const value of Array.from(data.keys())) {
					yield value;
				}
			}
		}
	}

	/**
	 * Update a value in the underlying array/map/set
	 *
	 * This should be called when the garbage collector needs to update a pointer
	 * contained within the cell data
	 *
	 * Note: for sets, the key is simply the old RuntimeValue. It will be removed
	 * from the set and the new value will be added instead to perform an "update"
	 */
	public update(key: CellDataTypeKey, value: RuntimeValue): void {
		switch (true) {
			case Array.isArray(this.data):
				(this.data as RuntimeValue[])[key as number] = value;
				break;
			case this.data instanceof Map:
				(this.data as Map<string, RuntimeValue>).set(key as string, value);
				break;
			case this.data instanceof Set: {
				// Remove the old value and add the new value to perform an "update"
				const set = this.data as Set<RuntimeValue>;
				set.delete(key as RuntimeValue);
				set.add(value);
			}
		}
	}

	/** Get a value from the underlying array, map, or set */
	public get(key: CellDataTypeKey): RuntimeValue | undefined {
		switch (true) {
			case Array.isArray(this.data):
				return (this.data as RuntimeValue[])[key as number];
			case this.data instanceof Map:
				return (this.data as Map<string, RuntimeValue>).get(key as string);
			case this.data instanceof Set: {
				const set = this.data as Set<RuntimeValue>;
				return set.has(key as RuntimeValue) ? (key as RuntimeValue) : undefined;
			}
		}
	}

	/** Length/size of the underlying array, map, or set */
	public get length(): number {
		switch (true) {
			/* istanbul ignore next */
			default:
			case Array.isArray(this.data):
				return (this.data as RuntimeValue[]).length;
			case this.data instanceof Map:
				return (this.data as Map<string, RuntimeValue>).size;
			case this.data instanceof Set:
				return (this.data as Set<RuntimeValue>).size;
		}
	}
}
