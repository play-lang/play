import { RuntimeType } from "src/vm/runtime-type";
import { RuntimeValue } from "src/vm/runtime-value";
import { GarbageCollector } from "../src/vm/garbage-collector";

describe("garbage collector", () => {
	test("initialize", () => {
		expect(new GarbageCollector()).toBeInstanceOf(GarbageCollector);
	});
	test("allocate", () => {
		const gc = new GarbageCollector();
		expect(gc.numActiveCells).toBe(0);
		let p0 = gc.alloc([num(1)], []);
		let p1 = gc.alloc([num(2)], []);
		p0 = gc.read(p0);
		expect(read(gc, p0, 0).value).toBe(1);
		p1 = gc.read(p1);
		expect(read(gc, p1, 0).value).toBe(2);
	});
	test("circular cleanup", () => {
		const gc = new GarbageCollector();
		let p0 = gc.alloc([ptr(-1)], []);
		let p1 = gc.alloc([ptr(-1)], []);
		gc.toSpace[p0].values.update(0, ptr(p1));
		gc.toSpace[p1].values.update(0, ptr(p0));
		expect(gc.numActiveCells).toBe(2);
		gc.collect([ptr(p0)]);
		expect(gc.numActiveCells).toBe(2);
		// Update pointers since collection happened:
		p0 = gc.read(p0);
		p1 = gc.read(p1);
		// Check that objects still point to each other:
		expect(read(gc, p0, 0).value).toBe(p1);
		expect(read(gc, p1, 0).value).toBe(p0);
		// Collect with no roots, should delete all data
		gc.collect([]);
		expect(gc.numActiveCells).toBe(0);
	});
	test("out of memory (alloc)", () => {
		const gc = new GarbageCollector({ heapSize: 4 });
		const p0 = gc.alloc([num(1)], []);
		const p1 = gc.alloc([num(2)], [ptr(p0)]);
		expect(() => {
			gc.alloc([num(3)], ptrs(p0, p1));
		}).toThrow();
	});
	test("out of memory (copy)", () => {
		const gc = new GarbageCollector({ heapSize: 8 });
		const p0 = gc.alloc([ptr(-1)], []);
		const p1 = gc.alloc([ptr(-1), num(100)], ptrs(p0));
		gc.toSpace[p0].values.update(0, ptr(p1));
		gc.toSpace[p1].values.update(0, ptr(p0));

		const p2 = gc.alloc([ptr(-1)], ptrs(p0, p1));
		const p3 = gc.alloc([ptr(-1)], ptrs(p0, p1, p2));
		gc.toSpace[p2].values.update(0, ptr(p3));
		gc.toSpace[p3].values.update(0, ptr(p2));

		// This should force the start of a collection
		expect(() => {
			/* const p4 = */ gc.alloc([ptr(-1)], ptrs(p0, p1, p2, p3));
		}).toThrow();

		expect(gc.numActiveCells).toBe(4);
		gc.collect([num(100), ...ptrs(p0, p2)]);
		expect(gc.numActiveCells).toBe(4);
	});
	test("insert", () => {
		const gc = new GarbageCollector();
		const p0 = gc.alloc([], []);
		const p1 = gc.alloc([], []);
		const p2 = gc.alloc(nums(1, 2, 3), []);
		const p3 = gc.alloc(nums(3, 4, 5), []);
		// const p3 = gc.alloc(nums(3, 4, 5), []);
		gc.insert(p0, nums(1, 2, 3, 4, 5));
		expect(gc.toSpace[p0].values.data).toEqual(nums(1, 2, 3, 4, 5));
		gc.insert(p1, nums(1, 2, 3, 4, 5), 0);
		expect(gc.toSpace[p1].values.data).toEqual(nums(1, 2, 3, 4, 5));
		gc.insert(p2, nums(4, 5), 3);
		expect(gc.toSpace[p2].values.data).toEqual(nums(1, 2, 3, 4, 5));
		gc.insert(p3, nums(1, 2, 3), 0);
		expect(gc.toSpace[p3].values.data).toEqual(nums(1, 2, 3, 4, 5));
		// Insert nothing should do nothing:
		gc.insert(p3, [], 3);
		expect(gc.toSpace[p3].values.data).toEqual(nums(1, 2, 3, 4, 5));
		// Out-of-bounds (invalid pointer)
		expect(() => {
			gc.insert(p3, nums(1, 2, 3, 4, 5), 8);
		}).toThrow();
	});
	test("remove", () => {
		const gc = new GarbageCollector();
		// Remove nothing from nothing
		const p0 = gc.alloc([], []);
		expect(gc.remove(p0, 0, 1)).toBe(false);
		expect(gc.toSpace[p0].values.data).toEqual([]);
		// Remove everything
		const p1 = gc.alloc(nums(1, 2, 3, 4, 5), []);
		expect(gc.remove(p1, 0, 5)).toBe(true);
		expect(gc.toSpace[p1].values.data).toEqual([]);
		// Remove last
		const p2 = gc.alloc(nums(1, 2, 3, 4, 5), []);
		expect(gc.remove(p2, 4)).toBe(true);
		expect(gc.toSpace[p2].values.data).toEqual(nums(1, 2, 3, 4));
		// Remove first
		const p3 = gc.alloc(nums(1, 2, 3, 4, 5), []);
		expect(gc.remove(p3, 0, 1)).toBe(true);
		expect(gc.toSpace[p3].values.data).toEqual(nums(2, 3, 4, 5));
		// Remove middle
		const p4 = gc.alloc(nums(1, 2, 3, 4, 5), []);
		expect(gc.remove(p4, 2, 1)).toBe(true);
		expect(gc.toSpace[p4].values.data).toEqual(nums(1, 2, 4, 5));
		// Invalid pointer
		const p5 = gc.alloc(nums(1, 2, 3, 4, 5), []);
		expect(() => {
			gc.remove(p5, 10, 1);
		}).toThrow();
		expect(gc.remove(p5, 0, 0)).toBe(false);
	});
	test("set/delete", () => {
		const gc = new GarbageCollector();
		const p0 = gc.alloc(new Map(), []);
		gc.set(p0, "a", num(1));
		gc.set(p0, "b", num(2));
		expect(gc.heap(p0, "a")).toEqual(num(1));
		expect(gc.heap(p0, "b")).toEqual(num(2));
		gc.delete(p0, "a");
		expect(gc.heap(p0, "a")).toBe(undefined);
		// "insert" is a list cell operation and can't be called on a map cell:
		expect(() => {
			gc.insert(p0, nums(1), 0);
		}).toThrow();
		// "remove" is a list cell operation and can't be called on a map cell:
		expect(() => {
			gc.remove(p0, 0, 1);
		}).toThrow();
		// Test invalid set/delete:
		expect(() => {
			gc.set(100, "a", num(100));
		}).toThrow();
		expect(() => {
			gc.delete(100, "a");
		}).toThrow();

		const p1 = gc.alloc(nums(1, 2, 3), []);
		// "set" is a map cell operation and can't be called on a list cell:
		expect(() => {
			gc.set(p1, "a", num(100));
		}).toThrow();
		// "delete" is a map cell operation and can't be called on a list cell:
		expect(() => {
			gc.delete(p1, "a");
		}).toThrow();
	});
});

function read(gc: GarbageCollector, addr: number, child: number): RuntimeValue {
	return gc.toSpace[addr].values.get(child)!;
}

function ptr(addr: number): RuntimeValue {
	return new RuntimeValue(RuntimeType.Pointer, addr);
}

function ptrs(...addresses: number[]): RuntimeValue[] {
	return addresses.map(addr => ptr(addr));
}

function num(value: number): RuntimeValue {
	return new RuntimeValue(RuntimeType.Number, value);
}

function nums(...values: number[]): RuntimeValue[] {
	return values.map(value => num(value));
}
