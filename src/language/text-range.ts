/**
 * Represents a range of text
 * Used by the pre-processor and lexer for error reporting
 */
export class TextRange {
	constructor(
		/** First index of the range */
		public readonly start: number,
		/** First index past the range */
		public readonly end: number
	) {}
}
