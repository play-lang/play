import { TextRange } from "../language/text-range";
import { TokenParser } from "../language/token-parser";
import { TokenType } from "../language/token-type";
import { Lexer } from "../lexer";

/** Represents a preprocessor that chains files together */
export class Preprocessor extends TokenParser {
	/**
	 * Maps file table index numbers to text ranges representing their position
	 * in the final combined preprocessor output string
	 *
	 * This will allow the lexer to determine which file a token started in
	 */
	public readonly ranges: Map<number, TextRange> = new Map();
	/** Set of fully qualified file paths encountered */
	public readonly fileSet: Set<string> = new Set();

	constructor(
		/** File to start preprocessing with */
		public readonly startingFilename: string,
		/**
		 * Function to call to resolve an include file path
		 * This function should return the fully qualified absolute file path
		 * for an include file path
		 *
		 * e.g., should produce a mapping like so:
		 *
		 * -  `"./file.play" => "/user/me/folders/here/file.play"`
		 * - `"/usr/me/folders/here/file.play" => "/usr/me/folders/here/file.play"`
		 *
		 * Should return a blank string if the file path is invalid
		 */
		public readonly filePathResolver: (path: string) => Promise<string>,
		/**
		 * Play supports "preprocessor"-like statements
		 *
		 * Function to call when the contents of another file are needed
		 * The fully qualified absolute file path returned from the
		 * filePathResolver will be given to this function as the path to fetch
		 *
		 * When a preprocessor clause is found indicating that the contents of
		 * another file should be inserted, this function will be invoked to fetch the contents of the specified file
		 */
		public readonly fileProvider: (path: string) => Promise<string>
	) {
		// Give it a dummy lexer for now
		super(new Lexer("", 0));
	}

	/**
	 * Add a file's to the file table
	 * @param filename The filename to add (the path to the file, relative
	 * or absolute)
	 */
	public async addFile(filename: string): Promise<number> {
		const absolutePath = await this.filePathResolver(filename);
		if (!absolutePath) {
			throw new Error(
				"Preprocessor: failed to find file `" +
					filename +
					"` at path `" +
					absolutePath +
					"`"
			);
		}
		this.fileTable.push(absolutePath);
		// Return the index to the new file in the file table
		return this.fileTable.length - 1;
	}

	/**
	 * Preprocess the starting file and all files that it includes
	 */
	public async preprocess(): Promise<string> {
		// Do the pre-processing
		return await this._preprocess(this.startingFilename);
	}

	/**
	 * Recursively pre-process the specified file
	 * @param path The absolute file path to preprocess (already resolved)
	 * @param file The file table index of the file to preprocess
	 */
	private async _preprocess(filename: string): Promise<string> {
		// Get the file's contents
		const file = await this.addFile(filename);
		const contents = await this.getFileContents(this.fileTable[file]);
		// Todo: While there are #include statements at the top of the file,
		// preprocess the heck out of it
		//
		// Make sure to only include a file once
		const lexer = new Lexer(contents, 0);
		let token = lexer.read();
		while (token.type === TokenType.PoundSign) {
			token = lexer.read();
			if (token.type !== TokenType.String) {
				throw new Error("Invalid preprocessor statement");
			}
		}
		return contents;
	}

	private async getFileContents(filename: string): Promise<string> {
		return await this.fileProvider(filename);
	}
}
