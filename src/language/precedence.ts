export enum Precedence {
	/** `a = b` */
	Assignment = 1,
	/** Ternary conditional: `a ? b : c` */
	Conditional,
	/** If a is nil, then b: `a ?? b` */
	NilCoalescing,
	/** Logical or `a or b` */
	LogicalOr,
	/** Logical and `a and b` */
	LogicalAnd,
	/** Equality and inequality `a == b`, `a != b` */
	Equality,
	/** Relational and type testing `a > b`, `a is b`, etc */
	Relational,
	Additive,
	Multiplicative,
	UnarySign,
	Exponent,
	UnaryPrefix,
	/** Function call invocation, indexer access, postfix operators, etc */
	Primary,
}
