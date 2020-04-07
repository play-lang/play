/**
 * Contains lightweight convenience functions for working with file
 * path strings
 */
export class PathUtil {
	/**
	 * Returns the short version of a filename, like "file.txt" as
	 * opposed to the full path
	 */
	public static filename(path: string): string {
		path = PathUtil.stripLeadingSlashes(path);
		let index = path.length - 1;
		while (path.length > 0 && path[index] && path[index] !== "/") {
			index -= 1;
		}
		return PathUtil.trimSlashes(path.substring(index));
	}

	/**
	 * Returns the directory that the specified path is in.
	 * @param path The path to a file or directory.
	 * @return Immediate directory of the path (furthest nested
	 * sub-folder specified).
	 */
	public static directory(path: string): string {
		path = PathUtil.stripLeadingSlashes(path);
		let index = path.length - 1;
		while (path[index] && path[index] !== "/") {
			index -= 1;
		}
		return PathUtil.trimSlashes(path.substring(0, index)) + "/";
	}

	/**
	 * Safely trims any leading and trailing backslashes from a path.
	 * @param path The path to process
	 */
	private static trimSlashes(path: string): string {
		return PathUtil.stripLeadingSlashes(PathUtil.stripTrailingSlashes(path));
	}

	/**
	 * Safely removes any trailing backslashes from a path.
	 * @param path The path to process
	 */
	private static stripTrailingSlashes(path: string): string {
		let index = path.length;
		while (path.length > 0 && path[index - 1] === "/") {
			index -= 1;
		}
		return path.substring(0, index);
	}

	/**
	 * Safely removes any leading backslashes from a path.
	 * @param path The path to process
	 */
	private static stripLeadingSlashes(path: string): string {
		let index = 0;
		while (path.length > 0 && path[index] === "/") {
			index += 1;
		}
		return path.substring(index);
	}
}
