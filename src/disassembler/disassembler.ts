import { Context } from "../language/context";
import { OpCode } from "../language/op-code";
import { RuntimeType } from "../vm/runtime-type";
import { RuntimeValue } from "../vm/runtime-value";

export class Disassembler {
	/** Pointer to the last found instruction */
	private ip: number = 0;
	/** Bytecode pointer */
	private p: number = 0;
	/** Data pointer */
	private dp: number = 0;

	/** Disassemble the specified context */
	public disassemble(context: Context): string {
		return (this.data(context) + this.instructions(context)).trim();
	}

	/** Disassemble data for the specified context */
	public data(context: Context): string {
		let str = "";
		this.dp = 0;
		while (this.dp < context.constantPool.length) {
			const value = context.constantPool[this.dp];
			str += this.dpn + "\t" + this.describe(value);
			this.dp++;
		}
		return str;
	}

	/** Disassemble instructions for the specified context */
	private instructions(context: Context): string {
		let str = "\n";
		this.p = 0;
		while (this.p < context.bytecode.length) {
			this.ip = this.p;
			const instr = context.bytecode[this.p++];
			switch (instr) {
				// 1 param instructions
				case OpCode.Constant: {
					const index = context.bytecode[this.p++];
					str +=
						this.ipn +
						"\t" +
						this.instr(instr) +
						"\t(" +
						index +
						")\t= " +
						context.constantPool[index].value +
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
					const jumpTarget = context.bytecode[this.p++];
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

	/** Formatted version of the instruction pointer */
	private get ipn(): string {
		return this.format(this.ip);
	}
	/** Formatted version of the data pointer */
	private get dpn(): string {
		return this.format(this.dp);
	}

	private instr(code: OpCode): string {
		return String(OpCode[code].toUpperCase()).padStart(20, " ");
	}
}
