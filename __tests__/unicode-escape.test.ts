import { escapeString, unescapeString } from "../src/common/unicode";

describe("unicode escape", () => {
	it("should escape strings correctly", () => {
		expect(escapeString("abc🙄😘123")).toEqual("abc\\u{1f644}\\u{1f618}123");
	});
});

describe("unicode unescape", () => {
	it("should unescape strings correctly", () => {
		expect(unescapeString("abc\\u{1f644}\\u{1f618}123")).toEqual("abc🙄😘123");
	});
});
