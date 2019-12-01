import { AvlTree } from "../src/common/avl-tree";
import { SourceFile } from "../src/language/source-file";
import { Play } from "../src/play";

/**
 * Template string tag to remove leading whitespace in lines when
 * template strings are represented in code with leading indentation
 * @param strings Template string input
 */
export function str(strings: TemplateStringsArray): string {
	// From: https://muffinresearch.co.uk/removing-leading-whitespace-in-es6-template-strings/
	const values = Array.prototype.slice.call(arguments, 1);
	let output = "";
	for (let i = 0; i < values.length; i++) {
		output += strings[i] + values[i];
	}
	output += strings[values.length];

	// Split on newlines.
	const lines = output
		.split(/(?:\r\n|\n|\r)/)
		.map(line => {
			return line.replace(/^\s+/gm, "");
		})
		.join("\n")
		.trim();

	return lines;
}

/** Run some code and return the value at the top of the stack */
export function run(code: string): any {
	return Play.run(code).value.value;
}

/**
 * Tests the ranges output from the preprocessor and returns the offending
 * filename if an error is detected
 * @param ranges The avl tree containing offset indices into the
 * preprocessor output string contents
 * @param fileContents Table of file contents keyed by file path
 * @param filenames Table of file paths
 */
export function testRanges(
	ranges: AvlTree<number, SourceFile>,
	fileContents: { [key: string]: string },
	filenames: string[]
): string {
	let pos = 0;
	let currentFilename = "";
	try {
		for (const filename of filenames) {
			currentFilename = filename;
			if (fileContents[filename].length > 0) {
				if (ranges.get(pos)!.path !== filename) {
					throw new Error();
				}
				// +1 for every new line that is inserted when a file is included by the
				// preprocessor
				pos += fileContents[filename].length + 1;
			}
		}
	} catch (e) {
		return currentFilename; // failed -- return the name of the failing file
	}
	return ""; // success
}
