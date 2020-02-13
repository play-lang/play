import { GarbageCollector } from "../src/vm/garbage-collector";
// import { RuntimeType } from "../src/vm/runtime-type";
// import { RuntimeValue } from "../src/vm/runtime-value";

describe("garbage collector", () => {
	test("initialize", () => {
		expect(new GarbageCollector()).toBeInstanceOf(GarbageCollector);
	});
});
