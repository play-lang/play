import { promises as fs } from "fs";
import * as path from "path";
import { AvlTree } from "../src/common/avl-tree";
import { SourceFile } from "../src/language/source-file";
import { Play } from "../src/play";
import { Preprocessor } from "../src/preprocessor/preprocessor";
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
export async function run(code: string): Promise<any> {
	const fileProvider = createFileProvider();
	const pp = new Preprocessor(
		"test.play",
		async (path: string) => path,
		async (path: string) => {
			if (path === "test.play") {
				return code;
			}
			return await fileProvider(path);
		}
	);
	const finalCode = await pp.preprocess();
	const result = Play.run(finalCode);
	return result.value.value;
}

/** Run the specified file */
export async function runFile(path: string): Promise<any> {
	const fileProvider = createFileProvider();
	const pp = new Preprocessor(path, async (path: string) => path, fileProvider);
	const finalCode = await pp.preprocess();
	const result = Play.run(finalCode);
	return result.value.value;
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

/**
 * Creates a test file provider
 * @param testFileName Name of the test file (preprocessor entry file)
 * @param testFileContents Test file contents (preprocessor entry file contents)
 * @param fileContents Table of included file contents
 */
export function createFakeFileProvider(
	testFileName: string,
	testFileContents: string,
	fileContents: { [key: string]: string }
): (path: string) => Promise<string> {
	return async (path: string): Promise<string> => {
		if (path === "test.play") {
			return testFileContents;
		}
		return fileContents[path];
	};
}

/**
 * Create a file provider that loads file from the system in the test
 * code folder
 */
export function createFileProvider(): (path: string) => Promise<string> {
	return async (p: string): Promise<string> => {
		const filePath = path.join("test-code", p);
		return await readFile(filePath);
	};
}

/** Read a file from the file system, folder */
export async function readFile(filename: string): Promise<string> {
	const filePath = path.join(process.cwd(), "__tests__", filename);
	return (await fs.readFile(filePath, { encoding: "utf-8" })) as string;
}
