import { describeAst } from "../shared/test-utils";

describe("action parsing", () => {
	it("should parse empty action", () => {
		expect(describeAst("action num compute(str x, num y) { }")).toEqual(
			"Program\n      └── Action num compute(str x, num y)"
		);
	});
});
