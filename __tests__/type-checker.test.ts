import { checkFile, preprocessFile } from "../shared/test-utils";
import { Play } from "../src/play";

describe("type-checker", () => {
	test("bad variable declaration", async () => {
		console.log(
			JSON.stringify(
				Play.describeAstAsJSON(
					await preprocessFile("check/bad-var-decl.play")
				),
				null,
				"\t"
			)
		);
		expect(
			(await checkFile("check/bad-var-decl.play")).map(err => err.message)
		).toEqual([
			"Type error in source at 1:4 (4):  Expected x to have type &Str instead of Num",
			"Type error in source at 2:4 (20):  Expected y to have type &Num instead of Str",
			"Type error in source at 4:0 (55):  Expected z to have type &Num instead of Str",
			"Type error in source at 5:11 (78):  Cannot use Str to add with Num",
		]);
	});
});
