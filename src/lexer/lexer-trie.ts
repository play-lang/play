import { TokenType } from "src/language/token/token-type";

/**
 * Recursive trie data structure that makes it easy to parse sequences
 * of characters that can have matches depending on what follows them
 * (i.e., both + and ++ are valid matches, but prefer to match ++ if
 * another + follows the first)
 *
 * Thanks to:
 * https://basarat.gitbooks.io/typescript/docs/types/index-signatures.html
 */
interface TrieMember {
	// If the character sequence can be a match, this is its token type
	type: TokenType;
	// Next characters that can be matched (recursive)
	next?: {
		[key: string]: TrieMember;
	};
}

/**
 * Prefix tree
 * https://en.wikipedia.org/wiki/Trie
 */
interface Trie {
	[key: string]: TrieMember;
}

export const lexerTrie: Trie = {
	"#": {
		// Preprocessor statement
		type: TokenType.PoundSign,
	},
	"=": {
		type: TokenType.Equal,
		next: {
			"=": {
				type: TokenType.EqualEqual,
			},
		},
	},
	"+": {
		type: TokenType.Plus,
		next: {
			"+": {
				type: TokenType.PlusPlus,
			},
			"=": {
				type: TokenType.PlusEqual,
			},
		},
	},
	"-": {
		type: TokenType.Minus,
		next: {
			"-": {
				type: TokenType.MinusMinus,
			},
			"=": {
				type: TokenType.MinusEqual,
			},
		},
	},
	"^": {
		type: TokenType.Caret,
		next: {
			"=": {
				type: TokenType.CaretEqual,
			},
		},
	},
	"*": {
		type: TokenType.Asterisk,
		next: {
			"=": {
				type: TokenType.AsteriskEqual,
			},
		},
	},
	"/": {
		type: TokenType.Slash,
		next: {
			"=": {
				type: TokenType.SlashEqual,
			},
		},
	},
	"%": {
		type: TokenType.Percent,
		next: {
			"=": {
				type: TokenType.PercentEqual,
			},
		},
	},
	"?": {
		type: TokenType.QuestionMark,
	},
	":": {
		type: TokenType.Colon,
	},
	",": {
		type: TokenType.Comma,
	},
	"!": {
		type: TokenType.Bang,
		next: {
			"=": {
				type: TokenType.BangEqual,
			},
		},
	},
	".": {
		type: TokenType.Dot,
	},
	"(": {
		type: TokenType.ParenOpen,
	},
	")": {
		type: TokenType.ParenClose,
	},
	"{": {
		type: TokenType.BraceOpen,
	},
	"}": {
		type: TokenType.BraceClose,
	},
	"[": {
		type: TokenType.BracketOpen,
	},
	"]": {
		type: TokenType.BracketClose,
	},
	">": {
		type: TokenType.GreaterThan,
		next: {
			"=": {
				type: TokenType.GreaterThanEqual,
			},
		},
	},
	"<": {
		type: TokenType.LessThan,
		next: {
			"=": {
				type: TokenType.LessThanEqual,
			},
		},
	},
};
