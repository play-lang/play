import { LoadedProgram } from "../language/loaded-program";
import { OpCode } from "../language/op-code";
import { RuntimeType } from "../vm/runtime-type";
import { RuntimeValue } from "../vm/runtime-value";

export class Disassembler {
	/** Formatted version of the instruction pointer */
	private get ipn(): string {
		return this.format(this.ip);
	}
	/** Formatted version of the data pointer */
	private get dpn(): string {
		return this.format(this.dp);
	}

	/** Program to disassemble */
	public readonly program: LoadedProgram;
	/** Pointer to the last found instruction */
	private ip: number = 0;
	/** Bytecode pointer */
	private p: number = 0;
	/** Data pointer */
	private dp: number = 0;

	constructor(program: LoadedProgram) {
		this.program = program;
	}

	/** Disassemble the specified program */
	public disassemble(): string {
		return (this.data() + this.instructions()).trim();
	}

	/** Disassemble data for the specified program */
	public data(): string {
		let str = "";
		this.dp = 0;
		while (this.dp < this.program.constantPool.length) {
			const value = this.program.constantPool[this.dp];
			str += this.dpn + "\t" + this.describe(value);
			this.dp++;
		}
		return str;
	}

	/** Disassemble instructions for the specified program */
	private instructions(): string {
		let str = "\n";
		this.p = 0;
		while (this.p < this.program.bytecode.length) {
			this.ip = this.p;
			const instr = this.program.bytecode[this.p++];
			switch (instr) {
				// 1 param instructions
				case OpCode.Constant: {
					const index = this.program.bytecode[this.p++];
					str +=
						this.ipn +
						"\t" +
						this.instr(instr) +
						"\t(" +
						index +
						")\t= " +
						this.program.constantPool[index].value +
						"\n";
					break;
				}
				case OpCode.Get:
				case OpCode.Set:
					// Todo: Describe locals
					break;
				// 0 param instructions
				case OpCode.Return:
				case OpCode.Pop:
				case OpCode.Neg:
				case OpCode.Inc:
				case OpCode.Dec:
				case OpCode.Add:
				case OpCode.Sub:
				case OpCode.Mul:
				case OpCode.Div:
				case OpCode.Remain:
				case OpCode.Exp:
				case OpCode.LessThan:
				case OpCode.LessThanEqual:
				case OpCode.GreaterThan:
				case OpCode.GreaterThanEqual:
				case OpCode.Equality:
				case OpCode.Inequality:
				case OpCode.Not:
				case OpCode.Nil:
				case OpCode.Zero:
				case OpCode.Blank:
				case OpCode.True:
				case OpCode.False:
					str += this.ipn + "\t" + this.instr(instr) + "\n";
					break;
				case OpCode.Jump:
				case OpCode.JumpFalse:
				case OpCode.JumpTrue: {
					const jumpTarget = this.program.bytecode[this.p++];
					str += this.ipn + "\t" + this.instr(instr) + "\t" + jumpTarget + "\n";
				}
			}
		}
		return str;
	}

	/** Describe a runtime value */
	private describe(value: RuntimeValue): string {
		return RuntimeType[value.type] + "\t" + value.value + "\n";
	}

	/** Pad a number and split it */
	private format(num: number): string {
		return String(num).padStart(4, "0");
	}

	private instr(code: OpCode): string {
		return String(OpCode[code].toUpperCase()).padStart(20, " ");
	}
}
