import { Context } from "../../language/context";
import { RuntimeType, RuntimeValue } from "../runtime-value";
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
		let str = "DATA:\n";
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
		let str = "INSTRUCTIONS:\n";
		this.ip = 0;
		while (this.ip < context.bytecode.length) {
			const instr = context.bytecode[this.ip++];
			switch (instr) {
				// 1 param instructions
				case OpCode.Literal: {
					const index = context.bytecode[this.ip++];
					str +=
						this.ipn + "\t" + OpCode[instr].toUpperCase() + "\t" + index + "\n";
					break;
				}
				// 0 param instructions
				case OpCode.Return:
				case OpCode.Print:
				case OpCode.Pop:
				case OpCode.Negate:
				case OpCode.And:
				case OpCode.Or:
				case OpCode.Add:
				case OpCode.Sub:
				case OpCode.Mul:
				case OpCode.Div:
				case OpCode.Mod:
				case OpCode.Exp:
					str += this.ipn + "\t" + OpCode[instr].toUpperCase() + "\n";
			}
		}
		return str;
	}

	/** Describe a runtime value */
	private describe(value: RuntimeValue): string {
		return RuntimeType[value.type] + "\t" + value.value + "\n";
	}

	/** Pad a number */
	private pad(num: number, places: number): string {
		return String(num).padStart(places, "0");
	}

	/** Formatted version of the instruction pointer */
	private get ipn(): string {
		return this.pad(this.ip, 4);
	}
	/** Formatted version of the data pointer */
	private get dpn(): string {
		return this.pad(this.dp, 4);
	}
}
