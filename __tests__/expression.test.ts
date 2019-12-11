import { run } from "../shared/test-utils";
import { Play } from "../src/play";

describe("compiler/vm", () => {
	test("should not register duplicates in the constant pool", () => {
		const dis = Play.disassemble('let x: str = "x"\nlet y: str = "x"');
		expect(
			dis.startsWith(
				"0000\tString\tx\n\n0000\t            CONSTANT\t(0)\t= x\n"
			)
		).toBe(true);
	});
	test("should compute expressions", async () => {
		// Throw some math at the language:
		expect(await run("return 5 + (3 - 2 ^ (-3 + 3) % 3) * 6 + 2 / 2")).toBe(18);
		expect(await run("return 10 + 11")).toBe(21);
		expect(await run("return 10 > 11")).toBe(false);
	});
	test("should compute ternary conditional operator", async () => {
		expect(await run("return true ? 2+3 : 4+5")).toBe(5);
		expect(await run("return false ? 2+3 : 4+5")).toBe(9);
		// Ensure that nested ternary operators evaluate correctly
		//
		// Nested on inside:
		expect(await run("return true ? true ? 1 : 2 : 3")).toBe(1);
		expect(await run("return true ? false ? 1 : 2 : 3")).toBe(2);
		expect(await run("return false ? true ? 1 : 2 : 3")).toBe(3);
		// Nested on outside:
		expect(await run("return true ? 1 : true ? 2: 3")).toBe(1);
		expect(await run("return false ? 1 : true ? 2: 3")).toBe(2);
		expect(await run("return false ? 1 : false ? 2: 3")).toBe(3);
	});
	test("should short-circuit logical operators", async () => {
		// And
		expect(await run("return false and false")).toBe(false);
		expect(await run("return false and 0")).toBe(false);
		expect(await run("return true and true")).toBe(true);
		expect(await run("return false and 20")).toBe(false);
		expect(await run("return 20 and 30")).toBe(30);
		expect(await run("return 0 and 30")).toBe(0);
		// Or
		expect(await run("return 0 or 1")).toBe(1);
		expect(await run("return 1 or 0")).toBe(1);
		expect(await run("return true or 20")).toBe(true);
		expect(await run("return false or true")).toBe(true);
		expect(await run("return false or 0")).toBe(0);
	});
	test("should successfully run blank code", async () => {
		expect(await run("")).toBe(0);
	});
	test("should successfully combine strings", async () => {
		expect(await run('return "a" + "b"')).toBe("ab");
	});
});
