import { TokenType } from "./token-type";
import { Precedence } from "./precedence";
import {
	PrefixParselet,
	InfixParselet,
	LiteralParselet,
	PrefixOperatorParselet,
	BinaryOperatorParselet,
	GroupParselet,
	TernaryConditionalParselet,
	AssignmentParselet,
	PostfixOperatorParselet,
} from "../parser/parselet";

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
	[TokenType.Number, new LiteralParselet()],
	[TokenType.String, new LiteralParselet()],
	[TokenType.Boolean, new LiteralParselet()],

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
	[TokenType.Or, new BinaryOperatorParselet(Precedence.LogicalOr, false)],
	[TokenType.And, new BinaryOperatorParselet(Precedence.LogicalAnd, false)],
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
]);
