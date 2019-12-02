/**
 * Returns the short version of a filename, like "file.txt" as
 * opposed to the full path
 */
export function filename(path: string): string {
	path = stripLeadingSlashes(path);
	let index = path.length - 1;
	while (path.length > 0 && path[index] && path[index] !== "/") {
		index -= 1;
	}
	return trimSlashes(path.substring(index));
}

/**
 * Returns the directory that the specified path is in.
 * @param path The path to a file or directory.
 * @return Immediate directory of the path (furthest nested
 * sub-folder specified).
 */
export function directory(path: string): string {
	path = stripLeadingSlashes(path);
	let index = path.length - 1;
	while (path[index] && path[index] !== "/") {
		index -= 1;
	}
	return trimSlashes(path.substring(0, index)) + "/";
}

/**
 * Safely trims any leading and trailing backslashes from a path.
 * @param path The path to process
 */
function trimSlashes(path: string): string {
	return stripLeadingSlashes(stripTrailingSlashes(path));
}

/**
 * Safely removes any trailing backslashes from a path.
 * @param path The path to process
 */
function stripTrailingSlashes(path: string): string {
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
function stripLeadingSlashes(path: string): string {
	let index = 0;
	while (path.length > 0 && path[index] === "/") {
		index += 1;
	}
	return path.substring(index);
}
