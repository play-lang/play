import { Play } from "src/play";

describe("collections", () => {
	describe("lists", () => {
		test("index into list literal", () => {
			const code = "return [1, 2, 3][2] // x = 3";
			console.log(Play.disassemble(code));
			expect(Play.run(code).value.value).toBe(3);
		});
		test("assign into list pointer", () => {
			const code = `
var x = [1, 2, 3]
x[0] = -100
return x[0]
`;
			console.log(Play.disassemble(code));
			expect(Play.run(code).value.value).toBe(-100);
		});
	});
});
