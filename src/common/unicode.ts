/**
 * Escapes a JavaScript string for output to a UTF8 file
 *
 * If the string includes characters that are not found in the Unicode
 * Basic Multilingual Plane (BMP) (characters with code points greater
 * than 0xFFFF), those characters will be converted to JavaScript escapes
 * (i.e., \u{FFFFFF} )
 * @param string The string to escape
 */
export function escapeString(string: string): string {
	// Use the ES6 string iterator to convert to an array of code points
	// (not char codes)
	const chars: string[] = Array.from(string);
	let result: string = "";
	for (const char of chars) {
		const codePoint = char.codePointAt(0)!;
		if (codePoint > 0xffff) {
			// Character is outside Unicode BMP
			result += "\\u{" + codePoint.toString(16) + "}";
		} else {
			if (char === "\n") {
				// Escape new line characters
				result += "\\n";
			} else if (char === "\r") {
				// Escape other new line characters
				result += "\\r";
			} else {
				result += char;
			}
		}
	}
	return result;
}

// https://github.com/iamakulov/unescape-js

// const escapeRegex = /(\\u\{([0-9A-Fa-f]+)\})/g;
const escapeRegex = /\\(u\{([0-9A-Fa-f]+)\}|(['"tbrnfv0\\]))/g;

const escapeCodes: { [key: string]: string } = {
	"0": "\0",
	b: "\b",
	f: "\f",
	n: "\n",
	r: "\r",
	t: "\t",
	v: "\v",
	"'": "'",
	'"': '"',
	"\\": "\\",
};

function fromHex(str: string): string {
	return String.fromCodePoint(Number.parseInt(str, 16));
}

/**
 * Unescape a string containing JavaScript escape sequences
 * @param string String containing valid JavaScript escape sequences
 */
export function unescapeString(string: string): string {
	return string.replace(
		escapeRegex,
		(_, __: string, codePointHex: string, specialCharacter: string) => {
			if (codePointHex) {
				return fromHex(codePointHex);
			} else {
				return escapeCodes[specialCharacter];
			}
		}
	);
}
