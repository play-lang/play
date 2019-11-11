export enum OpCode {
	/** Return instruction */
	Return = 1,
	/** Read data from data section */
	Literal,
	/** Negate the value */
	Negate,
	/** Print stack value */
	Print,
	/** Discard the top of the stack */
	Pop,
	/** Arithmetic */
	Add,
	Sub,
	Mul,
	Div,
	Mod,
	Exp,
	/** Logic */
	And,
	Or,
}
