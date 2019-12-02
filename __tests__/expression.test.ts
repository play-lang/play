import { run } from "../shared/test-utils";
import { Play } from "../src/play";

describe("compiler/vm", () => {
	it("should not register duplicates in the constant pool", () => {
		expect(
			Play.disassemble('let x: str = "x"\nlet y: str = "x"').startsWith(
				"0000\tString\tx\n\n0000\t            CONSTANT\t(0)\t= x\n"
			)
		).toBe(true);
	});
	it("should compute expressions", () => {
		// Throw some math at the language:
		expect(run("return 5 + (3 - 2 ^ (-3 + 3) % 3) * 6 + 2 / 2")).toBe(18);
		expect(run("return 10 + 11")).toBe(21);
		expect(run("return 10 > 11")).toBe(false);
	});
	it("should compute ternary conditional operator", () => {
		expect(run("return true ? 2+3 : 4+5")).toBe(5);
		expect(run("return false ? 2+3 : 4+5")).toBe(9);
		// Ensure that nested ternary operators evaluate correctly
		//
		// Nested on inside:
		expect(run("return true ? true ? 1 : 2 : 3")).toBe(1);
		expect(run("return true ? false ? 1 : 2 : 3")).toBe(2);
		expect(run("return false ? true ? 1 : 2 : 3")).toBe(3);
		// Nested on outside:
		expect(run("return true ? 1 : true ? 2: 3")).toBe(1);
		expect(run("return false ? 1 : true ? 2: 3")).toBe(2);
		expect(run("return false ? 1 : false ? 2: 3")).toBe(3);
	});
	it("should short-circuit logical operators", () => {
		// And
		expect(run("return false and false")).toBe(false);
		expect(run("return false and 0")).toBe(false);
		expect(run("return true and true")).toBe(true);
		expect(run("return false and 20")).toBe(false);
		expect(run("return 20 and 30")).toBe(30);
		expect(run("return 0 and 30")).toBe(0);
		// Or
		expect(run("return 0 or 1")).toBe(1);
		expect(run("return 1 or 0")).toBe(1);
		expect(run("return true or 20")).toBe(true);
		expect(run("return false or true")).toBe(true);
		expect(run("return false or 0")).toBe(0);
	});
	it("should successfully run blank code", () => {
		expect(run("")).toBe(0);
	});
});
