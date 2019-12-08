import { ErrorToken, TokenLike } from "../language/token";

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
export function describeErrorToken(errorToken: ErrorToken): string {
	return (
		"Lexical error in " +
		errorToken.file.name +
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

/**
 *  Creates an error message for a semantic error based on the specified token
 * @param token The token where the semantic error occurred
 * @param hint The error description
 */
export function formatSemanticError(token: TokenLike, hint: string): string {
	return (
		"Semantic error in " +
		token.file.name +
		" at " +
		token.line +
		":" +
		token.column +
		" (" +
		token.pos +
		"): " +
		hint
	);
}
