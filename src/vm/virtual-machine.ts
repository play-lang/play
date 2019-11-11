import { Context } from "../language/context";
import { OpCode } from "../language/op-code";
import { RuntimeValue } from "./runtime-value";
import { RuntimeError } from "./runtime-error";
import { VMResult } from "./vm-result";

/** Virtual machine that runs code */
export class VirtualMachine {
	/** Current bytecode context */
	public context: Context;
	/**
	 * Instruction pointer
	 * Always points to the next instruction to be evaluated
	 */
	public ip: number = 0;
	/** Stack */
	public readonly stack: RuntimeValue[] = [];

	constructor(context: Context) {
		this.context = context;
	}

	public run(): VMResult {
		try {
			let instruction = this.readCode();
			do {
				switch (instruction) {
					case OpCode.Return: {
						// Return from the current procedure or main section
						const top = this.pop();
						console.log("Execution complete", top ? top.value : "");
						// Todo: Don't return unless in global stack
						return VMResult.Success;
					}
					case OpCode.Literal: {
						// Read a data value from the data section and push it to the stack
						this.push(this.readData());
						break;
					}
					case OpCode.Print: {
						console.log(this.pop().value);
						break;
					}
					case OpCode.Pop: {
						this.pop();
						break;
					}
					case OpCode.Negate: {
						// Negate the top value of the stack
						const top = this.pop();
						this.push(new RuntimeValue(top.type, -top.value));
						break;
					}
					case OpCode.And: {
						const rhs = this.pop();
						const lhs = this.pop();
						// Todo: Fix this logical implementation problem
						this.push(new RuntimeValue(rhs.type, lhs.value && rhs.value));
						break;
					}
					case OpCode.Or: {
						const rhs = this.pop();
						const lhs = this.pop();
						// Todo: Fix this logical implementation problem
						this.push(new RuntimeValue(rhs.type, lhs.value || rhs.value));
						break;
					}
					case OpCode.Add: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(new RuntimeValue(rhs.type, lhs.value + rhs.value));
						break;
					}
					case OpCode.Sub: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(new RuntimeValue(rhs.type, lhs.value - rhs.value));
						break;
					}
					case OpCode.Mul: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(new RuntimeValue(rhs.type, lhs.value * rhs.value));
						break;
					}
					case OpCode.Div: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(new RuntimeValue(rhs.type, lhs.value / rhs.value));
						break;
					}
					case OpCode.Mod: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(new RuntimeValue(rhs.type, lhs.value % rhs.value));
						break;
					}
					case OpCode.Exp: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(new RuntimeValue(rhs.type, lhs.value ** rhs.value));
						break;
					}
				}
				instruction = this.readCode();
			} while (instruction);
			return VMResult.Success;
		} catch (e) {
			const code: VMResult =
				e instanceof RuntimeError ? e.code : VMResult.UnknownFailure;
			console.error(e);
			return code;
		}
	}

	/** Read the value at ip and increase ip by one */
	public readCode(): number {
		return this.context.bytecode[this.ip++];
	}

	/**
	 * Read the next value from the code and use it as an offset into the
	 * context data to return context data
	 */
	public readData(): RuntimeValue {
		const index = this.readCode();
		const data = this.context.data[index];
		return new RuntimeValue(data.type, data.value);
	}

	/** Pop an item, or die */
	public pop(): RuntimeValue {
		const top = this.stack.pop();
		if (!top) {
			throw new RuntimeError(VMResult.StackUnderflow, "Stack underflow");
		}
		return top;
	}

	/** Push a value to the stack */
	public push(value: RuntimeValue): void {
		this.stack.push(value);
	}
}
