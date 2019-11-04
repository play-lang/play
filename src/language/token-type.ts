/** Types of tokens available */
export enum TokenType {
	Error = 0,
	EndOfFile = 1,

	Line,
	LineContinuation,

	// Trivial tokens
	Whitespace,
	Comment,
	CommentBlock,

	// Reserved type names
	Str,
	Num,
	Map,
	List,

	// Reserved statement words
	If,
	While,
	For,
	Do,

	// Reserved declaration words
	Model,
	Contract,
	Has,
	Uses,

	// Preprocessor
	PoundSign,
	Insert,

	// Reserved Literal Words
	True,
	False,
	Nil,

	// Literals
	String,
	Number,

	Id,

	// Grouping Operators
	BracketOpen,
	BracketClose,
	ParenOpen,
	ParenClose,
	BraceOpen,
	BraceClose,

	// Operators
	Is,
	In,
	Or,
	And,
	Asterisk,
	Bang,
	QuestionMark,
	Colon,
	Comma,
	Slash,
	Equal,
	Plus,
	Minus,
	Percent,
	Caret,
	PlusEqual,
	MinusEqual,
	AsteriskEqual,
	SlashEqual,
	PercentEqual,
	CaretEqual,
	PlusPlus,
	MinusMinus,
	Dot,
	LessThan,
	GreaterThan,
	LessThanEqual,
	GreaterThanEqual,
	EqualEqual,
}

/** Mapping of identifier lexemes to particular id token types */
export const idTokenTypes: { [key: string]: TokenType } = {
	if: TokenType.If,
	while: TokenType.While,
	for: TokenType.For,
	do: TokenType.Do,
	num: TokenType.Num,
	str: TokenType.Str,
	map: TokenType.Map,
	list: TokenType.List,
	model: TokenType.Model,
	contract: TokenType.Contract,
	insert: TokenType.Insert,
	true: TokenType.True,
	false: TokenType.False,
	nil: TokenType.Nil,
	is: TokenType.Is,
	in: TokenType.In,
	or: TokenType.Or,
	and: TokenType.And,
};

/** Tokens that can indicate the start of a variable declaration statement */
export const leadingTypes: Set<TokenType> = new Set<TokenType>([
	TokenType.Id,
	TokenType.Num,
	TokenType.Str,
]);
