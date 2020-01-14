import { str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("control flow", () => {
	describe("if statements", () => {
		test("parse simple case", () => {
			const code = str`
				if (true and true) {
					callAFunction()
					// Add some numbers
					2 + 3 + 4
				}
			`;
			// const ast = Play.parse(code);
			console.log(Play.describeAst(code));
		});
	});
});
