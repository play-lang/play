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
		const a1 = gc.alloc([new RuntimeValue(RuntimeType.Number, 1)], []);
		const a2 = gc.alloc(
			[new RuntimeValue(RuntimeType.Number, 1)],
			[new RuntimeValue(RuntimeType.Pointer, a1)]
		);
		expect(a1).toBe(0);
		expect(a2).toBe(1);
	});
});
