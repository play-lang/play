import { compileAndLink, describeAst } from "../shared/test-utils";

describe("action parsing", () => {
	it("should parse empty action", () => {
		expect(describeAst("action num compute(str x, num y) { }")).toEqual(
			"Program\n      └── Action num compute(str x, num y)"
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
