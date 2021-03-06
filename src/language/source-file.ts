import { PathUtil } from "src/common/path-util";

/** Represents a Play language source file for use with the lexer */
export class SourceFile {
	constructor(
		/** Fully qualified absolute file path */
		public path: string,
		/** File contents as a JavaScript string */
		public contents: string
	) {}

	/**
	 * Returns the short version of a filename, like "file.txt" as
	 * opposed to the full path
	 */
	public get name(): string {
		return PathUtil.filename(this.path);
	}

	/**
	 * Immediate parent directory of the file
	 */
	public get directory(): string {
		return PathUtil.directory(this.path);
	}
}
