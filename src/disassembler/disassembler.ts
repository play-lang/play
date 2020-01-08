import { AvlTree } from "src/common/avl-tree";
import { Context } from "src/language/context";
import { ObjectCode } from "src/language/object-code";
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
	public disassemble(program: ObjectCode): string {
		let out: string = "";
		out += ".CONSTANTS\n";
		out += this.disassembleConstantPool(program.constantPool) + "\n";
		out += ".CODE\n";

		let contextTree: AvlTree<number, Context> = new AvlTree();
		if (program.contextMap) {
			program.contexts.forEach(context =>
				contextTree.insert(
					program.contextMap!.get(context.name)!,
					context
				)
			);
		}
		for (const context of program.contexts) {
			// Create AVL tree that maps the start index of each context to the context
			if (!program.contextMap) {
				contextTree = new AvlTree();
				contextTree.insert(0, context);
			}

			out += this.disassembleContext(
				context,
				program.bytecode || context.bytecode,
				program.constantPool,
				contextTree,
				program.contextMap ? program.contextMap.get(context.name)! : 0,
				program.contextLabels
					? program.contextLabels.labels
					: new Map<Context, Map<number, string>>()
			);
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
			out += "\t" + this.format(dp) + "\t" + this.value(value);
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
		bytecode: number[],
		constantPool: RuntimeValue[],
		contextTree: AvlTree<number, Context>,
		startOffset: number,
		contextLabels: Map<Context, Map<number, string>>
	): string {
		// Output string:
		let out: string = "";
		// Display the context's label
		out +=
			this.label(context.labelId) +
			`: ; (CONTEXT) ${context.numLocals} LOCAL \n`;
		out += this.disassembleBytecode(
			bytecode,
			context.bytecode.length,
			constantPool,
			contextTree,
			startOffset,
			contextLabels
		);
		return out;
	}

	public disassembleBytecode(
		bytecode: number[],
		length: number,
		constantPool: RuntimeValue[],
		contextTree: AvlTree<number, Context>,
		startOffset: number, // bytecode start offset, if any
		contextLabels: Map<Context, Map<number, string>>
	): string {
		// Output string:
		let out: string = "";
		// Current index into the bytecode:
		let p: number = startOffset;
		// Index of last instruction seen:
		let ip: number = startOffset;
		let context: Context = contextTree.get(
			contextTree.findLowerBound(startOffset)!
		)!;
		while (ip < startOffset + length) {
			ip = p;
			const op = bytecode[p++];
			// Use the AVL tree for speedily checking which context to use for labels
			const contextStartIndex = contextTree.findLowerBound(ip)!;
			const relIp = ip - startOffset;
			context = contextTree.get(contextStartIndex)!;
			// While we're at it, see if the current line is a label
			if (context.labels.has(relIp)) {
				out += this.label(context.labels.get(relIp)!) + ":\n";
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
					const labelIp = p - startOffset + offset;
					const absoluteIndex = startOffset + labelIp;
					if (context && context.labels.has(labelIp)) {
						out += this.jump(
							op,
							ip,
							offset,
							absoluteIndex,
							context.labels.get(labelIp)!
						);
					} else {
						throw new Error(
							"Can't find label for index " + absoluteIndex
						);
					}
					break;
				}
				case OpCode.Load: {
					const addr = bytecode[p++];
					const destContext = contextTree.get(addr) || undefined;
					if (destContext) {
						out += this.load(op, ip, destContext.labelId);
					} else {
						if (contextLabels.has(context)) {
							const contextRefs = contextLabels.get(context)!;
							if (contextRefs.has(relIp)) {
								const destContextName = contextRefs.get(relIp)!;
								out += this.loadWithNoInfo(
									op,
									ip,
									destContextName
								);
								break;
							}
						}
						out += this.instrParam(op, ip, addr);
					}
					break;
				}
				case OpCode.Call: {
					const numLocals = bytecode[p++];
					out += this.instrParam(op, ip, numLocals);
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
	 * @param labelId The destination label of the jump
	 */
	private jump(
		op: OpCode,
		ip: number,
		offset: number,
		destIp: number,
		labelId: number
	): string {
		return (
			"\t" +
			this.format(ip) +
			"\t" +
			this.op(op) +
			"\t" +
			this.format(offset) +
			"\t(INSTR " +
			this.format(destIp) +
			")\t" +
			this.label(labelId) +
			"\n"
		);
	}
	/**
	 * Outputs a function load instruction
	 * @param op The instruction to output
	 * @param ip The bytecode instruction index
	 * @param labelId The destination label of the jump
	 */
	private load(op: OpCode, ip: number, destContextLabelId: number): string {
		return (
			"\t" +
			this.format(ip) +
			"\t" +
			this.op(op) +
			"\t" +
			this.label(destContextLabelId) +
			" ; (CONTEXT)" +
			"\n"
		);
	}
	/**
	 * Outputs a function load instruction with no jump information
	 * @param op The instruction to output
	 * @param ip The bytecode instruction index
	 * @param contextName Name of the context to load the address of
	 */
	private loadWithNoInfo(
		op: OpCode,
		ip: number,
		contextName: string
	): string {
		return (
			"\t" +
			this.format(ip) +
			"\t" +
			this.op(op) +
			"\t[CONTEXT " +
			contextName +
			"]\n"
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
			"\t" +
			index +
			"\t[VALUE " +
			constantPool[index].value +
			"]\n"
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
		return "LABEL_" + this.format(labelId) + "";
	}
}
