export enum OpCode {
	// Specialty

	/** Return instruction */
	Return = 1,
	/** Push constant from constant pool */
	Const,
	/** Discard the top of the stack */
	Pop,
	/** Discard N items from the top of the stack */
	Drop,
	/** Get a value already in the stack */
	Get,
	/** Set a value already in the stack */
	Set,
	/** Push a copy of a global value already on the stack */
	GetGlobal,
	/** Set a global value already on the stack */
	SetGlobal,

	// Arithmetic

	/** Negate the value */
	Neg,
	/** Increment a numeric local by one */
	Inc,
	/** Decrement a numeric local by one */
	Dec,
	/** Increment a numeric local by one */
	IncGlobal,
	/** Decrement a numeric global by one */
	DecGlobal,
	/** Increment a value on the heap */
	IncHeap,
	/** Decrement a value on the heap */
	DecHeap,
	/** Add using the top two values of the stack */
	Add,
	/** Subtract using the top two values of the stack */
	Sub,
	/** Multiply using the top two values of the stack */
	Mul,
	/** Divide using the top two values of the stack */
	Div,
	/** Calculate remainder using the top two values of the stack */
	Remain,
	/** Calculate exponent using the top two values of the stack */
	Exp,

	// Relational Operators

	/** Less than relational operator */
	Less,
	/** Less than or equal relational operator */
	LessEqual,
	/** Greater than relational operator */
	Greater,
	/** Less than or equal relational operator */
	GreaterEqual,
	/** Equality comparison operator */
	Equal,
	/** Inequality */
	Unequal,

	/** Logical complement */
	Not,

	// Zero values

	/** Push the nil object pointer to the stack */
	Nil,
	/** Push the number zero to the stack */
	Zero,
	/** Push the blank string to the stack */
	Blank,
	/** Push the true value to the stack */
	True,
	/** Push the false value to the stack */
	False,

	// Jumps

	/** Unconditional jump */
	Jmp,
	/** Jump if top is falsy */
	JmpFalse,
	/** Jump if top is truthy */
	JmpTrue,
	/** Jump if false (and pop stack) */
	JmpFalsePop,
	/** Jump if true (and pop stack) */
	JmpTruePop,
	/** Jump unconditionally backwards */
	Loop,

	// Function calls

	/**
	 * Push a function call bytecode address offset onto the stack for
	 * later consumption with CALL
	 */
	Load,
	/** Call a function without allocating a new stack frame */
	Tail,
	/** Call a function */
	Call,
	/** Call a native function */
	CallNative,

	// Collections

	/** Construct a list from the top N items */
	MakeList,
	/** Construct a map from the top N key/value pairs */
	MakeMap,
	/** Index operator [] */
	Index,
	/** Set a value based on a heap pointer address and child index */
	SetHeap,
}
