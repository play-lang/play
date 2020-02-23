import { Play } from "src/play";
import { RuntimeError } from "src/vm/runtime-error";
import { VirtualMachine } from "src/vm/virtual-machine";

describe("collections", () => {
	describe("lists", () => {
		test("list literal index", () => {
			const code = "return [1, 2, 3][2] // x = 3";
			expect(Play.run(code).value.value).toBe(3);
		});
		test("assign into list pointer", () => {
			const code = `
var x = [1, 2, 3]
x = [4, 5, 6]
x[0] = -100
return x[0]
`;
			expect(Play.run(code).value.value).toBe(-100);
		});
		test("attempt assign to constant list", () => {
			const code = `let x = [1, 2, 3]\nx = [4, 5, 6]`;
			expect(Play.check(code)).toHaveLength(1);
		});
		test("chaining list literal index operations", () => {
			const code = `let x = [[1, 2], [3, 4], [5, 6]][1][1] // 4`;
			expect(Play.run(code).value.value).toBe(4);
		});
		test("bad assign to list literal", () => {
			const code = `[1, 2, 3] = [4, 5, 6]`;
			expect(() => {
				Play.run(code);
			}).toThrow();
		});
		test("empty list", () => {
			const code = `let x = []`;
			// Should receive a pointer to an empty list
			expect(Play.run(code).value.isPointer).toBe(true);
		});
		test("list literal w/ trailing comma", () => {
			const code = `let x = [1, 2, 3,][2]`;
			expect(Play.run(code).value.value).toBe(3);
		});
		test("member method access", () => {
			let code = `let x = [1, 2, 3]
x.push(1)
`;
			expect(Play.check(code).length).toBe(0);
			code = `let x = [1, 2, 3]
x.doesNotExist(1)
`;
			expect(() => {
				Play.check(code);
			}).toThrow();
		});
		describe("increment/decrement", () => {
			test("inc/dec bad index", () => {
				const code = `let x = [1, 2, 3]\nx[3]++`;
				expect(() => Play.run(code)).toThrow(RuntimeError);
			});
			test("inc/dec non-numeric value", () => {
				const code = `let x = ["a", "b", "c"]\nx[0]++`;
				expect(() => Play.run(code)).toThrow(RuntimeError);
			});
			test("inc number array value", () => {
				const code = `let x = [1, 2, 3, 4, 5]\nx[0]++\nreturn x[0]`;
				expect(Play.run(code).value.value).toBe(2);
			});
			test("dec number array value", () => {
				const code = `let x = [5, 4, 3, 2, 1]\nx[0]--\nreturn x[0]`;
				expect(Play.run(code).value.value).toBe(4);
			});
			test("postfix preserves values", () => {
				const code = `let x = [5, 4, 3, 2, 1]\nreturn x[0]--`;
				const vm = new VirtualMachine(Play.link(code));
				// Should return the non decremented value
				expect(vm.run().value.value).toBe(5);
				// Value stored in memory (forgive hard-coded heap address) should be
				// the decremented value
				expect(vm.gc.heap(1023, 0)!.value).toBe(4);
			});
		});
	});
	describe("maps", () => {
		test("empty map literal", () => {
			const code = `let x = {}`;
			expect(Play.run(code).value.isPointer).toBe(true);
		});
		test("map literal w/ chained index, trailing comma, bad formatting", () => {
			const code = `
				let x = {
					"x": {


						"a":
							100,

						"b": 200,
					},
					"y": {
						"a": 300
					}
				}["x"]["a"] // true
			`;
			expect(Play.run(code).value.value).toBe(100);
		});
	});
});
