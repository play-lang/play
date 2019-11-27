import { Play } from "../src/play";

describe("parser", () => {
	it("should parse", () => {
		const tree = Play.describeAstAsJSON("a + ((b - c) * 2)^-2 / 3 % 4");
		expect(tree).toEqual({});
	});
});
