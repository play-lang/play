import { Play } from "../src/play";

describe("control flow", () => {
	describe("if statements", () => {
		const bigIf = (a: string, b: string) => `
			let x = ${a}
			let y = ${b}
			if (x and y) {
				return 1
			} else if (!x and !y) {
				return 2
			} else if (x and !y) {
				return 3
			} else {
				return 4
			}
		`;
		test("check consequent", () => {
			const code = bigIf("true", "true");
			expect(Play.run(code).value.value).toBe(1);
		});
		test("check alternate 1", () => {
			const code = bigIf("false", "false");
			expect(Play.run(code).value.value).toBe(2);
		});
		test("check alternate 2", () => {
			const code = bigIf("true", "false");
			expect(Play.run(code).value.value).toBe(3);
		});
		test("check alternate catch-all", () => {
			const code = bigIf("false", "true");
			expect(Play.run(code).value.value).toBe(4);
		});
	});
	describe("while statements", () => {
		test("basic while statement", () => {
			const code = `
var x = 0
while (x < 10) {
	x++
}
return x + 1
			`.trim();
			console.log(code);
			console.log(Play.describeAst(code));
			console.log(Play.disassemble(code));
			expect(Play.run(code).value.value).toBe(11);
		});
	});
});
