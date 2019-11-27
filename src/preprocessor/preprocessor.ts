import { TextRange } from "../language/text-range";

/** Represents a preprocessor that chains files together */
export class Preprocessor {
	/**
	 * Maps file table index numbers to text ranges representing their position
	 * in the final combined preprocessor output string
	 *
	 * This will allow the lexer to determine which file a token started in
	 */
	public readonly ranges: Map<number, TextRange> = new Map();

	constructor(
		/** Table containing every file name encountered */
		public readonly fileTable: string[] = [],
		/**
		 * Function to call when the contents of another file are needed
		 *
		 * Play supports "preprocessor"-like statements
		 *
		 * When an #insert clause is found indicating that the contents of
		 * another file should be inserted at the specified place in the language
		 * this function will be invoked to fetch the contents of the specified
		 * file
		 */
		public readonly fileProvider: (path: string) => Promise<string>,
		/**
		 * Function to call to validate the specified file's path
		 * Should return false if the specified file path is invalid
		 */
		public readonly filePathValidator: (path: string) => Promise<boolean>
	) {}

	/**
	 * Add a file's contents to the input buffer, inserting it at the
	 * current lexer position
	 * @param filename The filename to add (the path to the file, relative
	 * or absolute)
	 */
	public async addFile(filename: string): Promise<number> {
		if (!(await this.filePathValidator(filename))) {
			throw new Error("Preprocessor: failed to find file `" + filename + "`");
		}
		this.fileTable.push(filename);
		// Return the index to the new file in the file table
		return this.fileTable.length - 1;
	}

	public async preprocess(filename: string): Promise<string> {
		const contents = await this.getFileContents(filename);
		return contents;
	}

	private async getFileContents(filename: string): Promise<string> {
		return await this.fileProvider(filename);
	}
}
