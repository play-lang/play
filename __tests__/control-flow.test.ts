import { str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("control flow", () => {
	describe("if statements", () => {
		test("parse simple case", () => {
			const code = str`
				if (true and true) {
					doIf()
				} else if (true and false) {
					doElseIf()
				} else if (false and false) {

				} else {
					doElse()
				}
			`;
			// const ast = Play.parse(code);
			console.log(Play.describeAst(code));
		});
	});
});
