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
	Add,
	Sub,
	Mul,
	Div,
	Mod,
	Exp,
}
