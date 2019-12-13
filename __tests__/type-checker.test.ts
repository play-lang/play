import { checkFile, preprocessFile } from "../shared/test-utils";
import { Play } from "../src/play";

describe("type-checker", () => {
	test("bad variable declaration", async () => {
		console.log(
			JSON.stringify(
				Play.describeAstAsJSON(await preprocessFile("check/bad-var-decl.play")),
				null,
				"\t"
			)
		);
		expect(await checkFile("check/bad-var-decl.play")).toEqual([]);
	});
});
