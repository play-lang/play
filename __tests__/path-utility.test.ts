import { PathUtil } from "../src/common/path-util";
describe("path utility", () => {
	test("should extract filenames", () => {
		expect(PathUtil.filename("")).toBe("");
		expect(PathUtil.filename("file.txt")).toBe("file.txt");
		expect(PathUtil.filename("some/folder/here with spaces/file.txt")).toBe(
			"file.txt"
		);
		expect(PathUtil.filename("some/folder/here with spaces/file-no ext")).toBe(
			"file-no ext"
		);
	});
	test("should extract folder names", () => {
		expect(PathUtil.directory("")).toBe("/");
		expect(PathUtil.directory("file")).toBe("/");
		expect(PathUtil.directory("a/very/long/folder/parent folder/file")).toBe(
			"a/very/long/folder/parent folder/"
		);
		expect(PathUtil.directory("//some/folder/with/extra/slashes//")).toBe(
			"some/folder/with/extra/slashes/"
		);
	});
});
