import { Play } from "src/play";

describe("collections", () => {
	describe("lists", () => {
		test("index into list literal", () => {
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
		test("should fail to assign to constant list?", () => {
			const code = `let x = [1, 2, 3]\nx = [4, 5, 6]`;
			expect(Play.check(code)).toHaveLength(1);
		});
	});
});
