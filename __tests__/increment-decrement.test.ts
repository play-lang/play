import { Play } from "../src/play";

describe("increment/decrement operators", () => {
	test("prefix increment", () => {
		const code = "var x = 1\nreturn ++x";
		expect(Play.run(code).value.value).toBe(2);
	});
	test("postfix increment", () => {
		const code = "var x = 1\nreturn x++";
		expect(Play.run(code).value.value).toBe(1);
	});
	test("prefix decrement", () => {
		const code = "var x = 1\nreturn --x";
		expect(Play.run(code).value.value).toBe(0);
	});
	test("postfix decrement", () => {
		const code = "var x = 1\nreturn x--";
		expect(Play.run(code).value.value).toBe(1);
	});
	test("postfix increment order", () => {
		const code = `
			var x = 1
			let y = 1 + x++
			// y = 2
			// x = 2
			return y
		`;
		expect(Play.run(code).value.value).toBe(2);
	});
	test("various odds and ends", () => {
		expect(
			Play.run(
				`
			var a = 1
			return a++ + a
			`
			).value.value
		).toBe(3);
		expect(() => {
			Play.run("5++");
		}).toThrow();
	});
});
