import { ErrorToken } from "../language/token";

/**
 * Ensures that the hint has no leading/trailing spaces and ends with a
 * punctuation mark
 * @param hint The hint to format
 */
export function prepareHint(hint: string): string {
	hint = hint.trim();
	const punctuation = hint[hint.length - 1];
	if (punctuation !== "." && punctuation !== "?" && punctuation !== "!") {
		hint += ".";
	}
	return hint;
}

/**
 * Generates a friendly description for an error token
 * @param errorToken Token to examine
 */
export function describeErrorToken(
	filename: string,
	errorToken: ErrorToken
): string {
	return (
		"Lexical error in " +
		filename +
		" at " +
		errorToken.line +
		":" +
		errorToken.column +
		" (" +
		errorToken.pos +
		")" +
		" with text `" +
		errorToken.lexeme +
		"`." +
		(errorToken.hints.size
			? " " +
			  Array.from(errorToken.hints)
					.join(" ")
					.trim()
			: "")
	);
}
