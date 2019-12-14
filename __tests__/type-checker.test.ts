import { checkFile } from "../shared/test-utils";

describe("type-checker", () => {
	test("bad variable declaration", async () => {
		// console.log(
		// 	JSON.stringify(
		// 		Play.describeAstAsJSON(await preprocessFile("check/bad-var-decl.play")),
		// 		null,
		// 		"\t"
		// 	)
		// );
		expect(await checkFile("check/bad-var-decl.play")).toEqual([]);
	});
});
