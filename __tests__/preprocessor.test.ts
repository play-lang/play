import { createFakeFileProvider, str, testRanges } from "../shared/test-utils";
import { Preprocessor } from "../src/preprocessor/preprocessor";

const filePathResolver = async (path: string): Promise<string> => {
	return path;
};

describe("preprocessor", () => {
	test("should initialize", () => {
		const fileProvider = async (path: string): Promise<string> => {
			return "";
		};
		const pp = new Preprocessor("test.play", filePathResolver, fileProvider);
		expect(pp).toBeInstanceOf(Preprocessor);
	});
	test("should combine files with empty file in the middle", async () => {
		const fileContents: { [key: string]: string } = {
			a: "file a",
			b: "file b",
			c: "",
			d: "file d",
			e: "file e",
		};
		const testFileContents = str`
			#include "a"
			#include "b"
			#include "c"
			#include "d"
			#include "e"
		`;
		const filenames = ["a", "b", "c", "d", "e"];
		const fileProvider = createFakeFileProvider(
			"test.play",
			testFileContents,
			fileContents
		);
		const pp = new Preprocessor("test.play", filePathResolver, fileProvider);
		await pp.preprocess();
		expect(testRanges(pp.ranges, fileContents, filenames)).toBe("");
	});
	test("should combine recursively", async () => {
		const fileContents: { [key: string]: string } = {
			a: str`
				#include "b"
			`,
			b: "file b",
			c: "file c",
		};
		const testFileContents = str`
			#include "a"
			#include "c"
		`;
		// Files should be included in the following order:
		const filenames = ["b", "a", "c"];
		const fileProvider = createFakeFileProvider(
			"test.play",
			testFileContents,
			fileContents
		);
		const pp = new Preprocessor("test.play", filePathResolver, fileProvider);
		await pp.preprocess();
		expect(testRanges(pp.ranges, fileContents, filenames)).toBe("");
	});
	test("should only include files once", async () => {
		const fileContents: { [key: string]: string } = {
			a: str`
				#include "b"
			`,
			b: "file b",
			c: "file c",
		};
		const testFileContents = str`
			#include "a"
			#include "b"
			#include "c"
		`;
		// Files should be included in the following order:
		const filenames = ["b", "a", "c"];
		const fileProvider = createFakeFileProvider(
			"test.play",
			testFileContents,
			fileContents
		);
		const pp = new Preprocessor("test.play", filePathResolver, fileProvider);
		await pp.preprocess();
		expect(testRanges(pp.ranges, fileContents, filenames)).toBe("");
	});
	test("should throw errors when it can't resolve a filename", async () => {
		const pp = new Preprocessor(
			"test.play",
			async (path: string) => "",
			async (path: string) => ""
		);
		expect(pp.addFile("does-not-exist.play")).rejects.toThrow();
	});
	test("should return nothing if it can't find file contents", async () => {
		const pp = new Preprocessor(
			"test.play",
			async (path: string) => path,
			async (path: string) => ""
		);
		expect(await pp.preprocess()).toBe("");
	});
	test("throws an error when a blank filename is included", async () => {
		const pp = new Preprocessor(
			"test.play",
			async (path: string) => path,
			async (path: string) => (path === "test.play" ? '#include ""' : "")
		);
		expect(pp.preprocess()).rejects.toThrow();
	});
});
