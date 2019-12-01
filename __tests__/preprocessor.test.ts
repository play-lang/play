import { str, testRanges } from "../shared/test-utils";
import { Preprocessor } from "../src/preprocessor/preprocessor";

const filePathResolver = async (path: string): Promise<string> => {
	return path;
};

describe("preprocessor", () => {
	it("should initialize", () => {
		const fileProvider = async (path: string): Promise<string> => {
			return "";
		};
		const pp = new Preprocessor("test.play", filePathResolver, fileProvider);
		expect(pp).toBeInstanceOf(Preprocessor);
	});
	it("should combine files with empty file in the middle", async () => {
		const fileContents: { [key: string]: string } = {
			a: "text1 text2 text3 text4",
			b: "text5 text6",
			c: "",
			d: "text 7",
			e: "text 8",
		};
		const testFileContents = str`
			#include "a"
			#include "b"
			#include "c"
			#include "d"
			#include "e"
		`;
		const filenames = ["a", "b", "c", "d", "e"];
		const fileProvider = async (path: string): Promise<string> => {
			if (path === "test.play") {
				return testFileContents;
			}
			return fileContents[path];
		};
		const pp = new Preprocessor("test.play", filePathResolver, fileProvider);
		await pp.preprocess();
		const ranges = pp.ranges;
		expect(testRanges(ranges, fileContents, filenames)).toBe("");
	});
	it("should combine recursively", () => {});
	it("should only include files once", () => {});
});
