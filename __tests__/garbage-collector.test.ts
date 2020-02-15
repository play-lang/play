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
			const v0 = values(1, 2, 3);
			const v1 = values(4);
			const p0 = gc.alloc(v0, []);
			const p1 = gc.alloc(v1, [p0]);
			expect(gc.toSpace[addr(p0)].values).toEqual(v0);
			expect(gc.toSpace[addr(p1)].values).toEqual(v1);
			const pp0 = p0.value as RuntimePointer;
			const pp1 = p1.value as RuntimePointer;
			// We can even predict the places where they will be stored:
			expect(pp0.addr).toBe(0);
			expect(pp1.addr).toBe(1);
			expect(pp0.toSpace).toBe(true);
			expect(pp1.toSpace).toBe(true);
		});
		test("invalidate individually", () => {
			const gc = new GarbageCollector({
				heapSize: 5,
			});
			const ptrs = setupCircularPointers(gc);
			expect(gc.toSpace).toHaveLength(2);
			expect(gc.fromSpace).toHaveLength(0);
			// This should collect nothing:
			gc.collectAll([ptrs[0]]);
			console.log(gc.description);
			expect(gc.toSpace).toHaveLength(2);
			expect(gc.fromSpace).toHaveLength(0);
			// This should collect everything
			gc.collectAll([]);
			expect(gc.toSpace).toHaveLength(0);
			expect(gc.fromSpace).toHaveLength(0);
		});
		test("invalidate all", () => {
			const gc = new GarbageCollector({
				heapSize: 5,
			});
			setupCircularPointers(gc);
			expect(gc.toSpace).toHaveLength(2);
			expect(gc.fromSpace).toHaveLength(0);
			// This should collect everything:
			gc.collectAll([]);
			expect(gc.toSpace).toHaveLength(0);
			expect(gc.fromSpace).toHaveLength(0);
		});
	});
});

function setupCircularPointers(gc: GarbageCollector): RuntimeValue[] {
	const v0 = values(1, -1);
	const v1 = values(2, -1);
	const p0 = gc.alloc(v0, []);
	const p1 = gc.alloc(v1, [p0]);
	// Update the second child field (index 1) in each allocated item
	// to point to each other
	gc.update(p0.ptr!, 1, value(p1));
	gc.update(p1.ptr!, 1, value(p0));
	// Ensure heap is as planned:
	const pp0 = p0.value as RuntimePointer;
	const pp1 = p1.value as RuntimePointer;
	// Sanity checks
	expect(pp0.toSpace).toBe(true);
	expect(pp1.toSpace).toBe(true);
	return [p0, p1];
}

function addr(value: RuntimeValue): number {
	return (value.value as RuntimePointer).addr!;
}

function values(...args: any[]): RuntimeValue[] {
	return args.map(arg => value(arg));
}

function value(arg: any): RuntimeValue {
	let type = RuntimeType.Number;
	switch (typeof arg) {
		case "boolean":
			type = RuntimeType.Boolean;
			break;
		case "string":
			type = RuntimeType.String;
			break;
		default:
			if (arg instanceof RuntimePointer) {
				type = RuntimeType.Pointer;
			} else if (arg instanceof RuntimeValue) {
				return arg.copy();
			}
	}
	return new RuntimeValue(type, arg);
}
