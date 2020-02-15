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
		let p0 = gc.allocate([new RuntimeValue(RuntimeType.Number, 1)], []);
		let p1 = gc.allocate([new RuntimeValue(RuntimeType.Number, 2)], []);
		console.log(gc.description);
		p0 = gc.read(p0);
		expect(gc.toSpace[p0].values[0].value).toBe(1);
		p1 = gc.read(p1);
		expect(gc.toSpace[p1].values[0].value).toBe(1);
	});
});
