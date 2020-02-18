import { Play } from "src/play";

describe("collections", () => {
	describe("lists", () => {
		test("parse", () => {
			// Parse a list
			console.log(Play.describeAst("let x = [1, 2, 3]"));
		});
	});
});
