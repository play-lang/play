import { RuntimeValue } from "src/vm/runtime-value";

export class CellData
	implements Iterable<[string | number | RuntimeValue, RuntimeValue]> {
	constructor(
		public readonly data:
			| RuntimeValue[]
			| Map<string, RuntimeValue>
			| Set<RuntimeValue>
	) {}

	public [Symbol.iterator](): Iterator<
		[string | number | RuntimeValue, RuntimeValue],
		any,
		undefined
	> {
		return this.iterator();
	}

	public *iterator(): Iterator<
		[string | number | RuntimeValue, RuntimeValue],
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
			case this.data instanceof Set: {
				const data = this.data as Set<RuntimeValue>;
				for (const value of data) {
					return [value, value];
				}
				break;
			}
		}
	}

	public get length(): number {
		switch (true) {
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
