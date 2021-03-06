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
	Import,
	If,
	Else,
	While,
	For,
	Do,
	Let,
	Var,
	Return,

	// Reserved declaration words
	Model,
	Protocol,
	Function,
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
	function: TokenType.Function,
	import: TokenType.Import,
	if: TokenType.If,
	else: TokenType.Else,
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
	protocol: TokenType.Protocol,
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

/** Prefix operator types mapped to their type annotation */
export const prefixTypeAnnotations: Map<TokenType, string[]> = new Map([
	[TokenType.Bang, ["bool"]],
	[TokenType.Plus, ["num"]],
	[TokenType.Minus, ["num"]],
	[TokenType.PlusPlus, ["num"]],
	[TokenType.MinusMinus, ["num"]],
]);

/** Prefix operator types mapped to their type annotation */
export const postfixTypeAnnotations: Map<TokenType, string[]> = new Map([
	[TokenType.PlusPlus, ["num"]],
	[TokenType.MinusMinus, ["num"]],
]);
