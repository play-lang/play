export enum OpCode {
	// Specialty

	/** Return instruction */
	Return = 1,
	/**
	 * Push a function call bytecode address offset onto the stack for
	 * later consumption with CALL
	 */
	Load,
	/** Push constant from constant pool */
	Constant,
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
	/** Increment by one */
	Inc,
	/** Decrement by one */
	Dec,
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
	LessThan,
	/** Less than or equal relational operator */
	LessThanEqual,
	/** Greater than relational operator */
	GreaterThan,
	/** Less than or equal relational operator */
	GreaterThanEqual,
	/** Equality comparison operator */
	Equality,
	/** Inequality */
	Inequality,

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
	Jump,
	/** Jump if top is falsy */
	JumpFalse,
	/** Jump if top is truthy */
	JumpTrue,
	/** Jump if false (and pop stack) */
	JumpFalsePop,
	/** Jump if true (and pop stack) */
	JumpTruePop,
	// Function calls

	/** Call a function */
	Call,
}
