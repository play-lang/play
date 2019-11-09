import { TokenType } from "./token-type";
import { Precedence } from "./precedence";
import {
	PrefixParselet,
	InfixParselet,
	LiteralParselet,
	PrefixOperatorParselet,
	BinaryOperatorParselet,
} from "../parser/expression/parselet";

// http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
// https://www.craftinginterpreters.com/compiling-expressions.html

/** Mapping of token types to prefix operator parsing classes */
export const prefixParselets: Map<TokenType, PrefixParselet> = new Map<
	TokenType,
	PrefixParselet
>([
	// Literal values
	[TokenType.Number, new LiteralParselet()],
	[TokenType.String, new LiteralParselet()],
	[TokenType.Boolean, new LiteralParselet()],

	// Prefix operators
	[TokenType.Bang, new PrefixOperatorParselet(Precedence.Prefix)],
	[TokenType.Plus, new PrefixOperatorParselet(Precedence.Prefix)],
	[TokenType.Minus, new PrefixOperatorParselet(Precedence.Prefix)],
	[TokenType.PlusPlus, new PrefixOperatorParselet(Precedence.Prefix)],
	[TokenType.MinusMinus, new PrefixOperatorParselet(Precedence.Prefix)],
]);

/** Mapping of token types to infix operator parsing classes */
export const infixParselets: Map<TokenType, InfixParselet> = new Map<
	TokenType,
	InfixParselet
>([[TokenType.Plus, new BinaryOperatorParselet(Precedence.Sum, false)]]);
