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

	// Preprocessor commands
	Include,

	// Reserved type names
	Str,
	Num,
	Bool,
	Map,
	List,
	Set,

	// Reserved statement words
	If,
	While,
	For,
	Do,
	Let,
	Var,
	Return,

	// Reserved declaration words
	Model,
	Contract,
	Action,
	Has,
	Uses,

	// Preprocessor
	PoundSign,
	Insert,

	// Reserved Literal Words
	Nil,

	// Literals
	String,
	Number,
	/** `true` or `false` token */
	Boolean,
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
	BangEqual,
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
	// Preprocessor commands:
	include: TokenType.Include,
	// Play language:
	action: TokenType.Action,
	if: TokenType.If,
	while: TokenType.While,
	for: TokenType.For,
	do: TokenType.Do,
	let: TokenType.Let,
	var: TokenType.Var,
	return: TokenType.Return,
	num: TokenType.Num,
	str: TokenType.Str,
	bool: TokenType.Bool,
	map: TokenType.Map,
	list: TokenType.List,
	set: TokenType.Set,
	model: TokenType.Model,
	contract: TokenType.Contract,
	insert: TokenType.Insert,
	true: TokenType.Boolean,
	false: TokenType.Boolean,
	nil: TokenType.Nil,
	is: TokenType.Is,
	in: TokenType.In,
	or: TokenType.Or,
	and: TokenType.And,
};

/** Primitive token types mapped to their type annotation */
export const primitiveTypeAnnotations: Map<TokenType, string[]> = new Map([
	[TokenType.String, ["str"]],
	[TokenType.Number, ["num"]],
	[TokenType.Boolean, ["bool"]],
	[TokenType.Nil, ["object"]],
]);
