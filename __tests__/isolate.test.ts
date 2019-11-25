import { run } from "../shared/test-utils";
import { Play } from "../src/play";

describe("problem with expressions", () => {
	it("should work", () => {
		// console.log(Play.describeAst("true ? 2+3 : 4+5"));
		console.log(Play.disassemble("true ? 2+3 : 4+5"));
		expect(run("true ? 2+3 : 4+5")).toBe(5); // failing
	});
});
