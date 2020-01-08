import { CompiledProgram } from "src/compiler/compiled-program";
import { Context } from "src/language/context";
import { OpCode } from "src/language/op-code";
import { RuntimeError } from "src/vm/runtime-error";
import { RuntimeType } from "src/vm/runtime-type";
import { RuntimeValue } from "src/vm/runtime-value";
import { VMStatus } from "src/vm/vm-status";

export class Disassembler {
	/**
	 * Disassembles the specified program and returns it as formatted mnemonics
	 * @param program The program to disassemble
	 */
	public disassemble(program: CompiledProgram): string {
		let out: string = "";
		out += "@CONSTANTS\n";
		out += this.disassembleConstantPool(program.constantPool) + "\n";
		out += "@CODE\n";
		for (const context of program.contexts) {
			out += this.disassembleContext(context, program.constantPool);
		}
		return out;
	}

	/**
	 * Disassembles the specified constant pool
	 * @param constantPool The constant pool to disassemble
	 */
	public disassembleConstantPool(constantPool: RuntimeValue[]): string {
		let out: string = "";
		let dp: number = 0;
		while (dp < constantPool.length) {
			const value = constantPool[dp];
			out += this.format(dp) + "\t" + this.value(value);
			dp++;
		}
		return out;
	}

	/**
	 * Disassembles the specified context and returns a string representation
	 * of the context
	 * @param context The context to disassemble
	 */
	public disassembleContext(
		context: Context,
		constantPool: RuntimeValue[]
	): string {
		// Output string:
		let out: string = "";
		// Current index into the bytecode:
		let p: number = 0;
		// Index of last instruction seen:
		let ip: number = 0;
		const bytecode = context.bytecode;
		while (ip < bytecode.length) {
			ip = p;
			const op = bytecode[p++];
			// See if the current line is a label
			if (context.labels.has(ip)) {
				out += this.label(context.labels.get(ip)!);
			}
			// Disassemble the instruction
			switch (op) {
				// Handle invalid instructions
				default: {
					throw new RuntimeError(
						VMStatus.InvalidInstruction,
						"Invalid instruction encountered: " +
							op +
							(OpCode[op] ? " (could be " + OpCode[op] + ")" : "")
					);
				}
				case OpCode.Return:
					out += this.instr(op, ip);
					break;
				case OpCode.Constant: {
					const index = bytecode[p++];
					out += this.const(op, ip, index, constantPool);
					break;
				}
				case OpCode.Pop:
					out += this.instr(op, ip);
					break;
				case OpCode.Drop: {
					const nItems = bytecode[p++];
					out += this.instrParam(op, ip, nItems);
					break;
				}
				case OpCode.Get:
				case OpCode.Set:
				case OpCode.GetGlobal:
				case OpCode.SetGlobal: {
					// Index of the variable to get/set
					const index = bytecode[p++];
					out += this.instrParam(op, ip, index);
					break;
				}
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
				case OpCode.False: {
					// None of the above require parameters
					out += this.instr(op, ip);
					break;
				}
				case OpCode.Jump:
				case OpCode.JumpFalse:
				case OpCode.JumpTrue:
				case OpCode.JumpFalsePop:
				case OpCode.JumpTruePop: {
					const offset = bytecode[p++];
					const destIp = p + offset;
					if (context.labels.has(destIp)) {
						out += this.jump(op, ip, context.labels.get(destIp)!);
					} else {
						throw new Error(
							"Cannot find label for index " + destIp
						);
					}
					break;
				}
				case OpCode.Load: {
					const addr = bytecode[p++];
					this.instrParam(op, ip, addr);
					break;
				}
				case OpCode.Call: {
					const numLocals = bytecode[p++];
					this.instrParam(op, ip, numLocals);
					break;
				}
			}
			ip = p;
		} // for op of bytecode
		return out;
	}

	/**
	 * Outputs a simple instruction with no parameters
	 * @param op The instruction to output
	 * @param ip The bytecode instruction index
	 */
	private instr(op: OpCode, ip: number): string {
		return "\t" + this.format(ip) + "\t" + this.op(op) + "\n";
	}

	/**
	 * Outputs an instruction with a single parameter
	 * @param op The instruction to output
	 * @param ip The bytecode instruction index
	 * @param param The instruction's parameter
	 */
	private instrParam(op: OpCode, ip: number, param: number): string {
		return (
			"\t" + this.format(ip) + "\t" + this.op(op) + "\t" + param + "\n"
		);
	}

	/**
	 * Outputs a jump instruction
	 * @param op The instruction to output
	 * @param ip The bytecode instruction index
	 * @param param The destination label of the jump
	 */
	private jump(op: OpCode, ip: number, destLabel: number): string {
		return (
			"\t" +
			this.format(ip) +
			"\t" +
			this.op(op) +
			"\tL" +
			this.format(destLabel) +
			"\n"
		);
	}

	/**
	 * Outputs the constant loading instruction
	 * @param op The instruction to output
	 * @param ip The bytecode instruction index
	 * @param index The index into the constant pool
	 * @param constantPool The constant pool
	 */
	private const(
		op: OpCode,
		ip: number,
		index: number,
		constantPool: RuntimeValue[]
	): string {
		return (
			"\t" +
			this.format(ip) +
			"\t" +
			this.op(op) +
			"\t(" +
			index +
			")\t=" +
			constantPool[index].value +
			"\n"
		);
	}

	/**
	 * Format a large number for output
	 * @param num The number to format
	 */
	private format(num: number): string {
		return String(num).padStart(4, "0");
	}

	/**
	 * Format an operation code as a mnemonic
	 * @param op Operation code to format
	 */
	private op(op: OpCode): string {
		return String(OpCode[op].toUpperCase()).padStart(20, " ");
	}

	/** Describe a runtime value */
	private value(value: RuntimeValue): string {
		return RuntimeType[value.type] + "\t" + value.value + "\n";
	}

	/**
	 * Formats the specified label id for output
	 * @param labelId The label id
	 */
	private label(labelId: number): string {
		return "L" + this.format(labelId) + ":\n";
	}
}
