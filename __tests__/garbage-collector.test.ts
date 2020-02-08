import { GarbageCollector } from "../src/vm/gc/garbage-collector";
import { RuntimeType } from "../src/vm/runtime-type";
import { RuntimeValue } from "../src/vm/runtime-value";

describe("garbage collector", () => {
	test("initialize", () => {
		const gc = new GarbageCollector();
		expect(gc).toBeInstanceOf(GarbageCollector);
	});
	test("allocate", () => {
		const gc = new GarbageCollector();
		const v1 = new RuntimeValue(RuntimeType.Number, 1);
		const a1 = gc.alloc([v1], []);
		const roots = [new RuntimeValue(RuntimeType.Pointer, a1)];
		const v2 = new RuntimeValue(RuntimeType.Number, 2);
		const a2 = gc.alloc([v2], roots);
		// Check addresses, they should be consecutive since consecutive allocations
		// without a collection
		expect(a1).toBe(0);
		expect(a2).toBe(1);
		// Force collection
		gc.collectAll(roots);
		// There should only be one surviving thing on the heap
		expect(gc.heap).toHaveLength(1);
		// The surviving value should be equivalent to the value we originally
		// gave it
		expect(veq(gc.heap[0].values[0], v1)).toBe(true);
	});
});

/** Check RuntimeValue equality */
function veq(lhs: RuntimeValue, rhs: RuntimeValue): boolean {
	return lhs.type === rhs.type && lhs.value === rhs.value;
}
