export enum OpCode {
	/** Return instruction */
	Return = 1,
	/** Read data from data section */
	Data,
	/** Negate the value */
	Neg,
	/** Increment by one */
	Inc,
	/** Decrement by one */
	Dec,
	/** Discard the top of the stack */
	Pop,
	/** Set a value already in the stack */
	Set,
	/** Get a value already in the stack */
	Get,
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
	/** Logical conjunction using top two values of the stack */
	And,
	/** Logical disjunction using top two values of the stack */
	Or,
	/** Logical complement */
	Not,
}
