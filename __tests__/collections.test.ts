import { Play } from "src/play";

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
			const code = `
let x = [1, 2, 3]
x.push(1)
			`;
			console.log(Play.describeAst(code));
		});
	});
	describe("maps", () => {
		test("empty map literal", () => {});
		test("map literal w/ trailing comma", () => {
			// const code = `
			// 	let x = {
			// 		"a": true,
			// 		"b": false,
			// 	}
			// `;
			// console.log(Play.describeAst(code));
		});
	});
});
