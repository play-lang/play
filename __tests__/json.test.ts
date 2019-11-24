import { str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("json tree printer", () => {
	it("should convert a simple AST to JSON", () => {
		try {
			const code = str`let myNum: num = 10 + 20 + 30`;
			const json = Play.describeAstAsJSON(code);
			console.log(JSON.stringify(json));
		} catch (e) {
			console.error(e);
			throw e;
		}
	});
});
