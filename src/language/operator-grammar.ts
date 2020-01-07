import {
	AssignmentParselet,
	BinaryLogicalOperatorParselet,
	BinaryOperatorParselet,
	GroupParselet,
	IdParselet,
	InfixParselet,
	InvocationOperatorParselet,
	PostfixOperatorParselet,
	PrefixOperatorParselet,
	PrefixParselet,
	PrimitiveParselet,
	TernaryConditionalParselet,
} from "../parser/parselet";
import { Precedence } from "./precedence";
import { TokenType } from "./token-type";

// http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
// https://www.craftinginterpreters.com/compiling-expressions.html

/** Mapping of token types to prefix operator parsing classes */
export const prefixParselets: Map<TokenType, PrefixParselet> = new Map<
	TokenType,
	PrefixParselet
>([
	// Parenthesis (grouping)
	[TokenType.ParenOpen, new GroupParselet()],
	// Literal values
	[TokenType.Number, new PrimitiveParselet()],
	[TokenType.String, new PrimitiveParselet()],
	[TokenType.Boolean, new PrimitiveParselet()],
	[TokenType.Nil, new PrimitiveParselet()],
	// Inside an expression, identifiers can represent function names or variables
	[TokenType.Id, new IdParselet()],
	// Prefix operators
	[TokenType.Bang, new PrefixOperatorParselet(Precedence.UnaryPrefix)],
	[TokenType.Plus, new PrefixOperatorParselet(Precedence.UnarySign)],
	[TokenType.Minus, new PrefixOperatorParselet(Precedence.UnarySign)],
	[TokenType.PlusPlus, new PrefixOperatorParselet(Precedence.UnaryPrefix)],
	[TokenType.MinusMinus, new PrefixOperatorParselet(Precedence.UnaryPrefix)],
]);

/**
 * Mapping of token types to infix operator parsing classes
 *
 * Infix is a bad name. It can be any fixity that's not prefix
 */
export const infixParselets: Map<TokenType, InfixParselet> = new Map<
	TokenType,
	InfixParselet
>([
	// Assignment
	[TokenType.Equal, new AssignmentParselet()],
	[TokenType.PlusEqual, new AssignmentParselet()],
	[TokenType.MinusEqual, new AssignmentParselet()],
	[TokenType.AsteriskEqual, new AssignmentParselet()],
	[TokenType.SlashEqual, new AssignmentParselet()],
	[TokenType.PercentEqual, new AssignmentParselet()],
	[TokenType.CaretEqual, new AssignmentParselet()],
	// Ternary Conditional Operator
	[TokenType.QuestionMark, new TernaryConditionalParselet()],
	// Nil-coalescing
	// Logical operators
	[TokenType.Or, new BinaryLogicalOperatorParselet(Precedence.LogicalOr)],
	[TokenType.And, new BinaryLogicalOperatorParselet(Precedence.LogicalAnd)],
	// Equality
	[
		TokenType.EqualEqual,
		new BinaryOperatorParselet(Precedence.Equality, false),
	],
	[
		TokenType.BangEqual,
		new BinaryOperatorParselet(Precedence.Equality, false),
	],
	// Relational operators
	[
		TokenType.LessThan,
		new BinaryOperatorParselet(Precedence.Relational, false),
	],
	[
		TokenType.LessThanEqual,
		new BinaryOperatorParselet(Precedence.Relational, false),
	],
	[
		TokenType.GreaterThan,
		new BinaryOperatorParselet(Precedence.Relational, false),
	],
	[
		TokenType.GreaterThanEqual,
		new BinaryOperatorParselet(Precedence.Relational, false),
	],
	// Binary operators
	[TokenType.Plus, new BinaryOperatorParselet(Precedence.Additive, false)],
	[TokenType.Minus, new BinaryOperatorParselet(Precedence.Additive, false)],
	[
		TokenType.Asterisk,
		new BinaryOperatorParselet(Precedence.Multiplicative, false),
	],
	[
		TokenType.Slash,
		new BinaryOperatorParselet(Precedence.Multiplicative, false),
	],
	[
		TokenType.Percent,
		new BinaryOperatorParselet(Precedence.Multiplicative, false),
	],
	[TokenType.Caret, new BinaryOperatorParselet(Precedence.Exponent, true)],

	// Postfix operators
	[TokenType.PlusPlus, new PostfixOperatorParselet()],
	[TokenType.MinusMinus, new PostfixOperatorParselet()],
	// Call operator (function invocation)
	[TokenType.ParenOpen, new InvocationOperatorParselet()],
]);
