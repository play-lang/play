import { Context } from "../../language/context";
import { RuntimeType } from "../runtime-type";
import { RuntimeValue } from "../runtime-value";
import { OpCode } from "../../language/op-code";

export class Disassembler {
	private ip: number = 0;
	private dp: number = 0;

	/** Disassemble the specified context */
	public disassemble(context: Context): string {
		return (this.data(context) + this.instructions(context)).trim();
	}

	/** Disassemble data for the specified context */
	public data(context: Context): string {
		let str = "";
		this.dp = 0;
		while (this.dp < context.data.length) {
			const value = context.data[this.dp];
			str += this.dpn + "\t" + this.describe(value);
			this.dp++;
		}
		return str;
	}

	/** Disassemble instructions for the specified context */
	private instructions(context: Context): string {
		let str = "\n";
		this.ip = 0;
		while (this.ip < context.bytecode.length) {
			const instr = context.bytecode[this.ip++];
			switch (instr) {
				// 1 param instructions
				case OpCode.Constant: {
					const index = context.bytecode[this.ip++];
					str +=
						this.ipn +
						"\t" +
						OpCode[instr].toUpperCase() +
						"\t(" +
						index +
						")\t= " +
						context.data[index].value +
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
				case OpCode.And:
				case OpCode.Or:
				case OpCode.Not:
				case OpCode.Nil:
				case OpCode.Zero:
				case OpCode.Blank:
				case OpCode.True:
				case OpCode.False:
					str += this.ipn + "\t" + OpCode[instr].toUpperCase() + "\n";
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
		const pad = String(num).padStart(9, "0");
		return (
			pad.substring(0, 3) +
			"\t" +
			pad.substring(3, 6) +
			"\t" +
			pad.substring(6, 9)
		);
	}

	/** Formatted version of the instruction pointer */
	private get ipn(): string {
		return this.format(this.ip);
	}
	/** Formatted version of the data pointer */
	private get dpn(): string {
		return this.format(this.dp);
	}
}
