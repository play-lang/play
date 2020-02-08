import { GarbageCollector } from "../src/vm/gc/garbage-collector";
import { RuntimeType } from "../src/vm/runtime-type";
import { RuntimeValue } from "../src/vm/runtime-value";

describe("garbage collector", () => {
	test("initialize", () => {
		const gc = new GarbageCollector();
		expect(gc).toBeInstanceOf(GarbageCollector);
	});
	describe("allocation", () => {
		const v1 = new RuntimeValue(RuntimeType.Number, 1);
		const v2 = new RuntimeValue(RuntimeType.Number, 2);
		const v3 = new RuntimeValue(RuntimeType.Number, 3);
		const v4 = new RuntimeValue(RuntimeType.Number, 4);
		test("plenty of space", () => {
			const gc = new GarbageCollector();
			const a1 = gc.alloc([v1], []);
			const roots = mRoots(a1);
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
		test("limited space", () => {
			// Garbage collector with a tiny heap size of 3
			const gc = new GarbageCollector({ heapSize: 3 });
			const a1 = gc.alloc([v1], []);
			const a2 = gc.alloc([v2], mRoots(a1));
			const a3 = gc.alloc([v3], mRoots(a1, a2));
			const a4 = gc.alloc([v4], mRoots(a2, a3)); // Should start a collection cycle
			// Since we dropped v1 as a root, we can expect to lose it after
			// collection cycle is complete
			expect(a4).toBe(2);
		});
		test("not enough space", () => {
			// Garbage collector with a tiny heap size of 3
			const gc = new GarbageCollector({ heapSize: 3 });
			const a1 = gc.alloc([v1], []);
			const a2 = gc.alloc([v2], mRoots(a1));
			const a3 = gc.alloc([v3], mRoots(a1, a2));
			expect(() => {
				// All 3 roots plus an attempt to allocate a fourth item should throw
				// an out-of-memory exception
				gc.alloc([v4], mRoots(a1, a2, a3));
			}).toThrow();
		});
		test("circular references", () => {
			const gc = new GarbageCollector({ heapSize: 3 });
			const v1 = new RuntimeValue(RuntimeType.Pointer, null);
			const a1 = gc.alloc([v1], []);
			const v2 = new RuntimeValue(RuntimeType.Pointer, a1);
			const a2 = gc.alloc([v2], mRoots(a1));
			// Update the first value to point to the second value to create
			// a circular reference
			gc.update(a1, 0, new RuntimeValue(RuntimeType.Pointer, a2));
			expect(gc.heap).toHaveLength(2);
			gc.collectAll(mRoots(a1));
			// After collecting with a single item in the roots, it should still
			// preserve both items since they reference each other
			expect(gc.heap).toHaveLength(2);
			gc.collectAll(mRoots(a2));
			// Same, but a different root with the child containing a reference to a1
			expect(gc.heap).toHaveLength(2);
			// Collect with no roots, should clear everything
			gc.collectAll([]);
			// Both items should be gone now since they weren't in the root set
			expect(gc.heap).toHaveLength(0);
		});
		test("circular reference destroyed", () => {
			const gc = new GarbageCollector({ heapSize: 3 });
			const v1 = new RuntimeValue(RuntimeType.Pointer, null);
			const a1 = gc.alloc([v1], []);
			const v2 = new RuntimeValue(RuntimeType.Pointer, a1);
			const a2 = gc.alloc([v2], mRoots(a1));
			// Update the first value to point to the second value to create
			// a circular reference
			gc.update(a1, 0, new RuntimeValue(RuntimeType.Pointer, a2));
			expect(gc.heap).toHaveLength(2);
			gc.collectAll(mRoots(a1));
			// After collecting with a single item in the roots, it should still
			// preserve both items since they reference each other
			expect(gc.heap).toHaveLength(2);
			// Remove the pointer reference keeping a2 alive
			const junk = new RuntimeValue(RuntimeType.Number, 1);
			gc.update(a1, 0, junk);
			// This collection should remove a2 and keep a1
			gc.collectAll(mRoots(a1));
			expect(gc.heap).toHaveLength(1);
			// Make sure a1 is left
			expect(veq(gc.heap[0].values[0], junk)).toBe(true);
		});
	});
});

/** Check RuntimeValue equality */
function veq(lhs: RuntimeValue, rhs: RuntimeValue): boolean {
	return lhs.type === rhs.type && lhs.value === rhs.value;
}

/** Make pointers from the specified heap addresses */
function mRoots(...addresses: number[]): RuntimeValue[] {
	return addresses.map(addr => new RuntimeValue(RuntimeType.Pointer, addr));
}
