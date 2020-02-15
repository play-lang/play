import { RuntimeType } from "src/vm/runtime-type";
import { RuntimeValue } from "src/vm/runtime-value";
import { GarbageCollector } from "../src/vm/gc3";
// import { RuntimeType } from "../src/vm/runtime-type";
// import { RuntimeValue } from "../src/vm/runtime-value";

describe("garbage collector", () => {
	test("initialize", () => {
		expect(new GarbageCollector()).toBeInstanceOf(GarbageCollector);
	});
	test("allocate", () => {
		const gc = new GarbageCollector();
		let p0 = gc.alloc([num(1)], []);
		let p1 = gc.alloc([num(2)], []);
		p0 = gc.read(p0);
		expect(read(gc, p0, 0).value).toBe(1);
		p1 = gc.read(p1);
		expect(read(gc, p1, 0).value).toBe(2);
	});
	test("circular cleanup", () => {
		const gc = new GarbageCollector();
		let p0 = gc.alloc([new RuntimeValue(RuntimeType.Pointer, -1)], []);
		let p1 = gc.alloc([new RuntimeValue(RuntimeType.Pointer, -1)], []);
		gc.toSpace[p0].values[0] = ptr(p1);
		gc.toSpace[p1].values[0] = ptr(p0);
		expect(gc.numActiveCells).toBe(2);
		gc.collect([ptr(p0)]);
		expect(gc.numActiveCells).toBe(2);
		// Update pointers since collection happened:
		p0 = gc.read(p0);
		p1 = gc.read(p1);
		// Check that objects still point to each other:
		expect(read(gc, p0, 0).value).toBe(p1);
		expect(read(gc, p1, 0).value).toBe(p0);
		// Collect with no roots
		gc.collect([]);
		expect(gc.numActiveCells).toBe(0);
		console.log(gc.description);
	});
});

function read(gc: GarbageCollector, addr: number, child: number): RuntimeValue {
	return gc.toSpace[addr].values[child];
}

function ptr(addr: number): RuntimeValue {
	return new RuntimeValue(RuntimeType.Pointer, addr);
}

function num(value: number): RuntimeValue {
	return new RuntimeValue(RuntimeType.Number, value);
}
