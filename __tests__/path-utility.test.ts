import { directory, filename } from "../src/common/path-utility";
describe("path utility", () => {
	it("should extract filenames", () => {
		expect(filename("")).toBe("");
		expect(filename("file.txt")).toBe("file.txt");
		expect(filename("some/folder/here with spaces/file.txt")).toBe("file.txt");
		expect(filename("some/folder/here with spaces/file-no ext")).toBe(
			"file-no ext"
		);
	});
	it("should extract folder names", () => {
		expect(directory("")).toBe("/");
		expect(directory("file")).toBe("/");
		expect(directory("a/very/long/folder/parent folder/file")).toBe(
			"a/very/long/folder/parent folder/"
		);
		expect(directory("//some/folder/with/extra/slashes//")).toBe(
			"some/folder/with/extra/slashes/"
		);
	});
});
