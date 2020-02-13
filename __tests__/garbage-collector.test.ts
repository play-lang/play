import { RuntimePointer } from "src/vm/runtime-pointer";
import { GarbageCollector } from "../src/vm/garbage-collector";
import { RuntimeType } from "../src/vm/runtime-type";
import { RuntimeValue } from "../src/vm/runtime-value";

describe("garbage collector", () => {
	test("initialize", () => {
		expect(new GarbageCollector()).toBeInstanceOf(GarbageCollector);
	});
	describe("allocation", () => {
		test("basic allocation", () => {
			const gc = new GarbageCollector();
			const v1 = values(1, 2, 3);
			const p1 = gc.alloc(v1, []);
			expect(gc.toSpace[addr(p1)].values).toEqual(v1);
		});
	});
});

function addr(value: RuntimeValue): number {
	return (value.value as RuntimePointer).addr!;
}

function values(...args: any[]): RuntimeValue[] {
	const values: RuntimeValue[] = [];
	for (const arg of args) {
		let type = RuntimeType.Number;
		switch (typeof arg) {
			case "boolean":
				type = RuntimeType.Boolean;
				break;
			case "string":
				type = RuntimeType.String;
				break;
		}
		values.push(new RuntimeValue(type, arg));
	}
	return values;
}
