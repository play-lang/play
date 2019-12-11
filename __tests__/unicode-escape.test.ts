import { escapeString, unescapeString } from "../src/common/unicode";

describe("unicode escape", () => {
	test("should escape strings correctly", () => {
		expect(escapeString('abc🙄😘123\n\r\\"')).toEqual(
			'abc\\u{1f644}\\u{1f618}123\\n\\r\\\\\\"'
		);
	});
});

describe("unicode unescape", () => {
	test("should unescape strings correctly", () => {
		expect(unescapeString('abc\\u{1f644}\\u{1f618}123\\n\\r\\\\\\"')).toEqual(
			'abc🙄😘123\n\r\\"'
		);
	});
});
