export enum OpCode {
	/** Return instruction */
	Return,
	/** Read data from data section */
	Data,
	/** Negate the value */
	Negate,
	/** Print stack value */
	Print,
	/** Discard the top of the stack */
	Pop,
	/** Literals for initializing zero-values */
	BlankString,
	Nil,
	False,
	True,
	Zero,
	/** Arithmetic */
	Add,
	Sub,
	Mul,
	Div,
	Mod,
	Exp,
}
