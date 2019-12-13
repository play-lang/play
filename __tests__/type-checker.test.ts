import { checkFile } from "../shared/test-utils";

describe("type-checker", () => {
	test("bad variable declaration", async () => {
		expect(await checkFile("check/bad-var-decl.play")).toEqual([]);
	});
});
