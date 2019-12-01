import { AvlTree } from "../common/avl-tree";
import { SourceFile } from "../language/source-file";
import { TokenParser } from "../language/token-parser";
import { TokenType } from "../language/token-type";
import { Lexer } from "../lexer";

/** Represents a preprocessor that chains files together */
export class Preprocessor {
	/**
	 * Maps string start position indices (from the combined string of all
	 * the imported files) to file table indices representing the start of a
	 * file in the combined string
	 */
	public readonly ranges: AvlTree<number, SourceFile> = new AvlTree<
		number,
		SourceFile
	>();
	/** Set of fully qualified file paths encountered */
	public readonly fileSet: Set<string> = new Set();
	/** Token parser stack used for pre-processing */
	public readonly parsers: TokenParser[] = [];
	/** Combined output string */
	public contents: string = "";

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
	) {}

	/**
	 * Add a file's to the file table
	 * @param filename The filename to add (the path to the file, relative
	 * or absolute)
	 */
	public async addFile(filename: string): Promise<SourceFile> {
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
		const file = new SourceFile(absolutePath);
		// Return the index to the new file in the file table
		return file;
	}

	/**
	 * Preprocess the starting file and all files that it includes
	 */
	public async preprocess(): Promise<string> {
		// Do the pre-processing
		this.contents = "";
		this.fileSet.clear();
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
		let contents = await this.getFileContents(file.path);
		// No point in including a blank file
		if (contents.length === 0 || this.fileSet.has(file.path)) return "";
		// Mark the file as having been visited
		this.fileSet.add(file.path);
		// Add a blank line just in case to prevent grammar from breaking
		contents += "\n";

		const lexer = new Lexer(contents, file);
		const parser = new TokenParser(lexer);
		// Eat up any lines at the beginning of the file
		parser.eatLines();
		// While there are #include statements at the top of the file,
		// preprocess the heck out of it
		while (parser.match(TokenType.PoundSign)) {
			const command = parser.consume(
				TokenType.Include,
				"Expected preprocessor command"
			);
			if (command.type === TokenType.Include) {
				// #include "filename.play" <-- Found include preprocessor command
				const filenameToken = parser.consume(
					TokenType.String,
					"Include filename expected"
				);
				const filename = filenameToken.lexeme;
				if (!filename) {
					throw parser.error(filenameToken, "Must provide a valid filename");
				}
				// Recursively include files
				await this._preprocess(filename);
				parser.eatLines();
			}
		}

		// Record where this file starts in the combined contents buffer BEFORE
		// we add our contents to the combined buffer
		this.ranges.insert(this.contents.length, file);

		// Add this file's contents to the combined contents
		this.contents += contents;

		return this.contents;
	}

	private async getFileContents(filename: string): Promise<string> {
		return await this.fileProvider(filename);
	}
}
