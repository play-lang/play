import { AvlTree } from "../common/avl-tree";
import { SourceFile } from "./source-file";

/**
 * Represents a compiled preprocessor string file that has a table of files
 * and a tree of range positions representing where those files occur in the
 * combined preprocessor string
 */
export class PreprocessedFile {
	constructor(
		/** File table containing source file information */
		public readonly fileTable: SourceFile[],
		/** Range tree that maps string position numbers to file table indices */
		public readonly ranges: AvlTree<number, SourceFile>
	) {}
}
