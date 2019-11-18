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
			result += char;
		}
	}
	return result;
}

// https://github.com/iamakulov/unescape-js

/**
 * \\ - matches the backslash which indicates the beginning of an escape sequence
 * (
 *   u\{([0-9A-Fa-f]+)\} - first alternative; matches the variable-length hexadecimal escape sequence (\u{ABCD0})
 * |
 *   u([0-9A-Fa-f]{4}) - second alternative; matches the 4-digit hexadecimal escape sequence (\uABCD)
 * |
 *   x([0-9A-Fa-f]{2}) - third alternative; matches the 2-digit hexadecimal escape sequence (\xA5)
 * |
 *   ([1-7][0-7]{0,2}|[0-7]{2,3}) - fourth alternative; matches the up-to-3-digit octal escape sequence (\5 or \512)
 * |
 *   (['"tbrnfv0\\]) - fifth alternative; matches the special escape characters (\t, \n and so on)
 * |
 *   \U([0-9A-Fa-f]+) - sixth alternative; matches the 8-digit hexadecimal escape sequence used by python (\U0001F3B5)
 * )
 */
const jsEscapeRegex = /\\(u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|(['"tbrnfv0\\]))|\\U([0-9A-Fa-f]{8})/g;

const usualEscapeSequences: { [key: string]: string } = {
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

function fromOct(str: string): string {
	return String.fromCodePoint(Number.parseInt(str, 8));
}

/**
 * Unescape a string containing JavaScript escape sequences
 * @param string String containing valid JavaScript escape sequences
 */
export function unescapeString(string: string): string {
	return string.replace(
		jsEscapeRegex,
		(
			_: string,
			__: string,
			varHex: string,
			longHex: string,
			shortHex: string,
			octal: string,
			specialCharacter: string,
			python: string
		) => {
			if (varHex !== undefined) {
				return fromHex(varHex);
			} else if (longHex !== undefined) {
				return fromHex(longHex);
			} else if (shortHex !== undefined) {
				return fromHex(shortHex);
			} else if (octal !== undefined) {
				return fromOct(octal);
			} else if (python !== undefined) {
				return fromHex(python);
			} else {
				return usualEscapeSequences[specialCharacter];
			}
		}
	);
}
