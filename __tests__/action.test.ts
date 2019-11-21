import { compileAndLink, describeAst, jsonAst } from "../shared/test-utils";

describe("action parsing", () => {
	it("should parse empty action", () => {
		expect(describeAst("action num compute(str x, num y) { }")).toEqual(
			"Program\n      └── Action num compute(str x, num y)\n"
		);
	});
	it("should parse action invocations", () => {
		console.log("");
		// NOTE: Expected variable name following declaration because
		// we can't parse unknown identifiers yet!
		console.log(
			expect(
				jsonAst(`
			num a
			num b
			num c
			someAction(a, b, c)
		`)
			).toEqual({
				statements: [
					{
						name: "a",
						typeAnnotation: ["num"],
					},
					{
						name: "b",
						typeAnnotation: ["num"],
					},
					{
						name: "c",
						typeAnnotation: ["num"],
					},
					{
						lhs: {
							actionName: "someAction",
						},
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
					},
				],
			})
		);
	});
	it("compiler should produce compilation context for each action", () => {
		// const code = "action str hello(str name) {\n" + "1 + 2" + "}";
		const code = `
			action str hello(str name) {

				1 + 2

			}

			action str goodbye(str name) {

				3 + 4

			}
		`;
		console.log(describeAst(code));
		console.log(compileAndLink(code));
	});
});
