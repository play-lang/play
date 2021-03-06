import { AvlTree } from "src/common/avl-tree";
import { Context } from "src/language/context/context";
import { OpCode } from "src/language/op-code";
import { ObjectCode } from "src/language/program";
import { VMError } from "src/vm/vm-error";
import { VMStatus } from "src/vm/vm-status";
import { VMType } from "src/vm/vm-type";
import { VMValue } from "src/vm/vm-value";

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
				contextTree.insert(program.contextMap!.get(context.name)!, context)
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
	public disassembleConstantPool(constantPool: VMValue[]): string {
		let out: string = "";
		let dp: number = 0;
		while (dp < constantPool.length) {
			const value = constantPool[dp];
			out += "\t" + this.format(dp).trim() + "\t" + this.value(value);
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
		constantPool: VMValue[],
		contextTree: AvlTree<number, Context>,
		startOffset: number,
		contextLabels: Map<Context, Map<number, string>>
	): string {
		// Output string:
		let out: string = "";
		// Display the context's label
		out += `; Context ${context.name}\n`;
		out +=
			`; ${context.numLocals} ` +
			(context.numLocals === 1 ? "local" : "locals") +
			"\n";
		out += this.label(context.labelId) + ":\n";
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
		constantPool: VMValue[],
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
					throw new VMError(
						VMStatus.InvalidInstruction,
						"Invalid instruction encountered: " +
							op +
							(OpCode[op] ? " (could be " + OpCode[op] + ")" : "")
					);
				}
				case OpCode.Return:
					out += this.instr(op, ip);
					break;
				case OpCode.Const: {
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
				case OpCode.SetGlobal:
				case OpCode.Inc:
				case OpCode.Dec:
				case OpCode.IncGlobal:
				case OpCode.DecGlobal: {
					// Index of the variable to get/set or increment/decrement
					const index = bytecode[p++];
					out += this.instrParam(op, ip, index);
					break;
				}
				case OpCode.IncHeap:
				case OpCode.DecHeap:
				case OpCode.Neg:
				case OpCode.Add:
				case OpCode.Sub:
				case OpCode.Mul:
				case OpCode.Div:
				case OpCode.Remain:
				case OpCode.Exp:
				case OpCode.Less:
				case OpCode.LessEqual:
				case OpCode.Greater:
				case OpCode.GreaterEqual:
				case OpCode.Equal:
				case OpCode.Unequal:
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
				case OpCode.Jmp:
				case OpCode.JmpFalse:
				case OpCode.JmpTrue:
				case OpCode.JmpFalsePop:
				case OpCode.JmpTruePop:
				case OpCode.Loop: {
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
						// throw new Error(
						// 	"Can't find label for index " + absoluteIndex
						// );
					}
					break;
				}
				case OpCode.Load: {
					const addr = bytecode[p++];
					const destContext = contextTree.get(addr) || undefined;
					if (destContext) {
						// The linker has been run, as seen by the existence of entries
						// in the context tree which is populated from the context map
						// that the linker produces
						out += this.load(
							op,
							ip,
							addr,
							destContext.labelId,
							destContext.name
						);
					} else {
						// Linker hasn't run, look up the context name in the context labels
						// that will be given to the linker
						if (contextLabels.has(context)) {
							const contextRefs = contextLabels.get(context)!;
							if (contextRefs.has(relIp)) {
								const destContextName = contextRefs.get(relIp)!;
								out += this.loadWithNoInfo(op, ip, addr, destContextName);
								break;
							}
						}
						out += this.instrParam(op, ip, addr);
					}
					break;
				}
				case OpCode.Tail:
				case OpCode.Call: {
					const numLocals = bytecode[p++];
					out += this.instrParam(op, ip, numLocals);
					break;
				}
				case OpCode.CallNative: {
					const numLocals = bytecode[p++];
					const nativeFunctionIndex = bytecode[p++];
					out += this.instrParam(op, ip, numLocals, nativeFunctionIndex);
					break;
				}
				// Collections
				case OpCode.MakeList:
				case OpCode.MakeMap: {
					const numItems = bytecode[p++];
					out += this.instrParam(op, ip, numItems);
					break;
				}
				case OpCode.Index:
				case OpCode.SetHeap: {
					// These don't require parameters as their operands live on the stack
					out += this.instr(op, ip);
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
		return "\t" + this.format(ip).trim() + "\t" + this.op(op) + "\n";
	}

	/**
	 * Outputs an instruction with the specified parameters
	 * @param op The instruction to output
	 * @param ip The bytecode instruction index
	 * @param param The instruction's parameter
	 */
	private instrParam(op: OpCode, ip: number, ...param: number[]): string {
		return (
			"\t" +
			this.format(ip).trim() +
			"\t" +
			this.op(op) +
			"\t" +
			param.map(param => this.format(param)).join("\t") +
			"\n"
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
			this.format(ip).trim() +
			"\t" +
			this.op(op) +
			"\t" +
			this.format(offset) +
			"\t; " +
			this.label(labelId) +
			" (instr " +
			this.format(destIp) +
			") " +
			"\n"
		);
	}
	/**
	 * Outputs a function load instruction
	 * @param op The instruction to output
	 * @param ip The bytecode instruction index
	 * @param addr The address of the context to load
	 * @param labelId The destination label of the jump
	 * @param contextName Name of the context to load the address of
	 */
	private load(
		op: OpCode,
		ip: number,
		addr: number,
		destContextLabelId: number,
		contextName: string
	): string {
		return (
			"\t" +
			this.format(ip).trim() +
			"\t" +
			this.op(op) +
			"\t" +
			this.format(addr) +
			"\t; " +
			this.label(destContextLabelId) +
			" context " +
			contextName +
			"\n"
		);
	}
	/**
	 * Outputs a function load instruction with no jump information
	 * @param op The instruction to output
	 * @param ip The bytecode instruction index
	 * @param addr The address of the context to load
	 * @param contextName Name of the context to load the address of
	 */
	private loadWithNoInfo(
		op: OpCode,
		ip: number,
		addr: number,
		contextName: string
	): string {
		return (
			"\t" +
			this.format(ip).trim() +
			"\t" +
			this.op(op) +
			"\t" +
			addr +
			"\t; context " +
			contextName +
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
		constantPool: VMValue[]
	): string {
		return (
			"\t" +
			this.format(ip).trim() +
			"\t" +
			this.op(op) +
			"\t" +
			this.format(index) +
			"\t; value " +
			constantPool[index].value +
			"\n"
		);
	}

	/**
	 * Format a large number for output
	 * @param num The number to format
	 */
	private format(num: number): string {
		return (num < 0 ? "-" : " ") + String(Math.abs(num)).padStart(4, "0");
	}

	/**
	 * Format an operation code as a mnemonic
	 * @param op Operation code to format
	 */
	private op(op: OpCode): string {
		return String(OpCode[op].toLowerCase()).padStart(20, " ");
	}

	/** Describe a runtime value */
	private value(value: VMValue): string {
		return VMType[value.type].toLowerCase() + "\t" + value.value + "\n";
	}

	/**
	 * Formats the specified label id for output
	 * @param labelId The label id
	 */
	private label(labelId: number): string {
		return "label_" + this.format(labelId).trim() + "";
	}
}
