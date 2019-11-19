import { compile, run } from "../shared/test-utils";

describe("compiler/vm", () => {
	it("should not register duplicates in the constant pool", () => {
		expect(
			compile('str x = "x"\nstr y = "x"').startsWith(
				"0000\tString\tx\n\n0000\t            CONSTANT\t(0)\t= x\n"
			)
		).toBe(true);
	});
	it("should compute expressions", () => {
		// Throw some math at the language:
		expect(run("5 + (3 - 2 ^ (-3 + 3) % 3) * 6 + 2 / 2")).toBe(18);
		expect(run("10 + 11")).toBe(21);
		expect(run("10 > 11")).toBe(false);
	});
	it("should compute ternary conditional operator", () => {
		expect(run("true ? 2+3 : 4+5")).toBe(5);
		expect(run("false ? 2+3 : 4+5")).toBe(9);
		// Ensure that nested ternary operators evaluate correctly
		//
		// Nested on inside:
		expect(run("true ? true ? 1 : 2 : 3")).toBe(1);
		expect(run("true ? false ? 1 : 2 : 3")).toBe(2);
		expect(run("false ? true ? 1 : 2 : 3")).toBe(3);
		// Nested on outside:
		expect(run("true ? 1 : true ? 2: 3")).toBe(1);
		expect(run("false ? 1 : true ? 2: 3")).toBe(2);
		expect(run("false ? 1 : false ? 2: 3")).toBe(3);
	});
	it("should short-circuit logical operators", () => {
		// And
		expect(run("false and false")).toBe(false);
		expect(run("false and 0")).toBe(false);
		expect(run("true and true")).toBe(true);
		expect(run("false and 20")).toBe(false);
		expect(run("20 and 30")).toBe(30);
		expect(run("0 and 30")).toBe(0);
		// Or
		expect(run("0 or 1")).toBe(1);
		expect(run("1 or 0")).toBe(1);
		expect(run("true or 20")).toBe(true);
		expect(run("false or true")).toBe(true);
		expect(run("false or 0")).toBe(0);
	});
});
