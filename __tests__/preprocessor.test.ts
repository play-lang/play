import { str } from "../shared/test-utils";
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
	it("should combine files", async () => {
		const testFiles: { [key: string]: string } = {
			a: "text1 text2 text3 text4",
			b: "text5 text6",
			c: "",
			d: "text 7",
			e: "text 8",
		};
		const fileProvider = async (path: string): Promise<string> => {
			if (path === "test.play") {
				return str`
				#include "a"
				#include "b"
				#include "c"
				#include "d"
				#include "e"
			`;
			}
			return testFiles[path];
		};
		const pp = new Preprocessor("test.play", filePathResolver, fileProvider);
		const result = await pp.preprocess();
		console.log("Result");
		console.log(result);
	});
});
