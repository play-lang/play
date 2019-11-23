// import { compileAndLink, describeAst, jsonAst } from "../shared/test-utils";
import { describeAst } from "../shared/test-utils";

describe("action parsing", () => {
	it("should call an action", () => {
		const code = `action addNumbers() { return 2 + 3 }
		addNumbers()`;
		console.log(describeAst(code));
	});
	/*
	it("should parse empty action", () => {
		expect(describeAst("action compute(x: str, y: num): num { }")).toEqual(
			"Program\n      └── Action num compute(str x, num y)\n"
		);
	});
	it("should parse action invocations", () => {
		// NOTE: Expected variable name following declaration because
		// we can't parse unknown identifiers yet!
		console.log(
			expect(
				jsonAst(`
			let a: num
			let b: num
			let c: num
			someAction(a, b, c)
		`)
			).toEqual({
				statements: [
					{
						isImmutable: true,
						token: {
							column: 7,
							fileTableIndex: 0,
							length: 1,
							lexeme: "a",
							line: 2,
							pos: 8,
							trivia: [
								{
									column: 6,
									fileTableIndex: 0,
									length: 1,
									lexeme: " ",
									line: 2,
									pos: 7,
									trivia: [],
									type: 4,
								},
							],
							type: 30,
						},
						typeAnnotation: ["num"],
					},
					{
						isImmutable: true,
						token: {
							column: 7,
							fileTableIndex: 0,
							length: 1,
							lexeme: "b",
							line: 3,
							pos: 22,
							trivia: [
								{
									column: 6,
									fileTableIndex: 0,
									length: 1,
									lexeme: " ",
									line: 3,
									pos: 21,
									trivia: [],
									type: 4,
								},
							],
							type: 30,
						},
						typeAnnotation: ["num"],
					},
					{
						isImmutable: true,
						token: {
							column: 7,
							fileTableIndex: 0,
							length: 1,
							lexeme: "c",
							line: 4,
							pos: 36,
							trivia: [
								{
									column: 6,
									fileTableIndex: 0,
									length: 1,
									lexeme: " ",
									line: 4,
									pos: 35,
									trivia: [],
									type: 4,
								},
							],
							type: 30,
						},
						typeAnnotation: ["num"],
					},
					{
						args: [
							{
								variableName: "a",
							},
							{
								variableName: "b",
							},
							{
								variableName: "c",
							},
						],
						lhs: {
							actionName: "someAction",
						},
					},
				],
			})
		);
	});
	it("compiler should produce compilation context for each action", () => {
		// const code = "action str hello(str name) {\n" + "1 + 2" + "}";
		const code = `
			action hello(name: str): str {

				1 + 2

			}

			action goodbye(name: str): str {

				3 + 4

			}
		`;
		console.log(describeAst(code));
		console.log(compileAndLink(code));
	});
	*/
});
