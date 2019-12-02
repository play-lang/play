import { LoadedProgram } from "../language/loaded-program";
import { OpCode } from "../language/op-code";
import { Frame } from "./frame";
import { RuntimeError } from "./runtime-error";
import { RuntimeType } from "./runtime-type";
import { RuntimeValue } from "./runtime-value";
import { VMResult } from "./vm-result";
import { VMStatus } from "./vm-status";

// Make constants for zero values since they are so widely used
const Nil: RuntimeValue = new RuntimeValue(RuntimeType.Object, null);
const Zero: RuntimeValue = new RuntimeValue(RuntimeType.Number, 0);
const Blank: RuntimeValue = new RuntimeValue(RuntimeType.String, "");
const True: RuntimeValue = new RuntimeValue(RuntimeType.Boolean, true);
const False: RuntimeValue = new RuntimeValue(RuntimeType.Boolean, false);

/** Virtual machine that runs code */
export class VirtualMachine {
	/** Current bytecode context */
	public program: LoadedProgram;
	/**
	 * Instruction pointer
	 *
	 * Always represents the index of the next instruction to be evaluated
	 */
	public get ip(): number {
		return this.frame.ip;
	}

	public set ip(value: number) {
		this.frame.ip = value;
	}

	/** Bytecode of the program */
	public get bytecode(): number[] {
		return this.program.bytecode;
	}

	/** Constant pool of the program */
	public get constantPool(): RuntimeValue[] {
		return this.program.constantPool;
	}

	/** Stack */
	public readonly stack: RuntimeValue[] = [];
	/** Stack frames */
	public readonly frames: Frame[] = [];

	constructor(program: LoadedProgram) {
		this.program = program;
		// Add the main stack frame:
		this.frames.push(new Frame(0, 0, program.numGlobals));
	}

	public run(): VMResult {
		try {
			while (true) {
				const instruction = this.readCode();
				if (!(instruction in OpCode)) {
					throw new RuntimeError(
						VMStatus.InvalidInstruction,
						"Invalid instruction encountered: " + instruction
					);
				}
				switch (instruction) {
					case OpCode.Return: {
						// Grab the return value so that we can clean up the locals
						// below it
						const returnValue = this.pop();
						if (this.frame.numLocals > 0) {
							// Clean up locals (or globals) created for this call frame
							this.drop(this.frame.numLocals);
						}
						if (this.frames.length === 1) {
							if (this.stack.length > 0) {
								throw new RuntimeError(
									VMStatus.UnknownFailure,
									"Internal error: Execution completed but stack still has values"
								);
							}
							return new VMResult(VMStatus.Success, returnValue);
						} else {
							// Push the return value back on to the stack
							this.stack.push(returnValue);
							// Pop the call frame and resume execution at the previous ip
							this.frames.pop();
						}
						break;
					}
					case OpCode.Load: {
						this.push(new RuntimeValue(RuntimeType.Number, this.readCode()));
						break;
					}
					case OpCode.Constant: {
						// Read a data value from the data section and push it to the stack
						this.push(this.readData());
						break;
					}
					case OpCode.Pop: {
						this.pop();
						break;
					}
					case OpCode.Drop: {
						// Drop the specified number of items from the top of the stack
						// (hopefully more efficient than repeated popping)
						this.drop(this.readCode());
						break;
					}
					case OpCode.Get: {
						// Get a local variable
						const index = this.readCode() + this.frame.basePointer;
						this.push(this.readStack(index));
						break;
					}
					case OpCode.Set: {
						// Set a local variable
						const index = this.readCode() + this.frame.basePointer;
						this.stack[index] = this.top;
						break;
					}
					case OpCode.GetGlobal: {
						// Get a global variable
						this.push(this.readStack());
						break;
					}
					case OpCode.SetGlobal: {
						const index = this.readCode();
						this.stack[index] = this.top;
						break;
					}
					case OpCode.Neg: {
						// Negate the top value of the stack
						const top = this.pop();
						this.push(new RuntimeValue(top.type, -top.value));
						break;
					}
					case OpCode.Inc: {
						// Increment the top value of the stack
						const top = this.pop();
						this.push(new RuntimeValue(top.type, top.value + 1));
						break;
					}
					case OpCode.Dec: {
						// Decrement the top value of the stack
						const top = this.pop();
						this.push(new RuntimeValue(top.type, top.value - 1));
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
					case OpCode.Remain: {
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
					case OpCode.LessThan: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value < rhs.value ? True : False);
						break;
					}
					case OpCode.LessThanEqual: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value <= rhs.value ? True : False);
						break;
					}
					case OpCode.GreaterThan: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value > rhs.value ? True : False);
						break;
					}
					case OpCode.GreaterThanEqual: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value >= rhs.value ? True : False);
						break;
					}
					case OpCode.Equality: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value === rhs.value ? True : False);
						break;
					}
					case OpCode.Inequality: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value !== rhs.value ? True : False);
						break;
					}
					case OpCode.Not: {
						const rhs = this.pop();
						this.push(this.isTruthy(rhs) ? False : True);
						break;
					}
					// Zero-values (like in Go)
					case OpCode.Nil: {
						this.push(Nil);
						break;
					}
					case OpCode.Zero: {
						this.push(Zero);
						break;
					}
					case OpCode.Blank: {
						this.push(Blank);
						break;
					}
					case OpCode.True: {
						this.push(True);
						break;
					}
					case OpCode.False: {
						this.push(False);
						break;
					}
					case OpCode.Jump: {
						this.ip = this.readCode();
						break;
					}
					case OpCode.JumpFalse: {
						const dest = this.readCode();
						if (!this.isTruthy(this.top)) this.ip = dest;
						break;
					}
					case OpCode.JumpTrue: {
						const dest = this.readCode();
						if (this.isTruthy(this.top)) this.ip = dest;
						break;
					}
					case OpCode.Call: {
						const numLocals = this.readCode();
						const dest = this.pop();
						if (dest.type !== RuntimeType.Number) {
							throw new RuntimeError(
								VMStatus.InvalidOperands,
								"Invalid invocation destination"
							);
						}
						const ip = dest.value as number;
						const basePointer = this.stack.length - numLocals;
						this.frames.push(new Frame(ip, basePointer, numLocals));
						break;
					}
				}
				// Return if we reached the end
				if (this.ip >= this.bytecode.length) break;
			}
			return new VMResult(VMStatus.Success, this.top || Nil);
		} catch (e) {
			const code: VMStatus =
				e instanceof RuntimeError ? e.code : VMStatus.UnknownFailure;
			console.error(e);
			return new VMResult(code, this.top || Nil);
		}
	}

	/** Read the value at ip and increase ip by one */
	public readCode(): number {
		return this.bytecode[this.ip++];
	}

	/**
	 * Read the next value from the code and use it as an offset into the
	 * context data to return context data
	 */
	public readData(): RuntimeValue {
		const index = this.readCode();
		const data = this.constantPool[index];
		return new RuntimeValue(data.type, data.value);
	}

	/**
	 * Read a value from the stack using the next number in the code as an
	 * index into the stack (or the supplied number)
	 *
	 * Typically used for reading variables on the stack
	 * @param index The index to read in the stack, if any
	 */
	public readStack(index?: number): RuntimeValue {
		const i = typeof index === "undefined" ? this.readCode() : index;
		const rv = this.stack[i];
		return new RuntimeValue(rv.type, rv.value);
	}

	/** Pop an item from the stack and return it if possible */
	public pop(): RuntimeValue {
		const top = this.stack.pop();
		if (!top) {
			throw new RuntimeError(VMStatus.StackUnderflow, "Stack underflow");
		}
		return top;
	}

	/**
	 * Pop the specified number of items off the stack and discard them
	 * @param numItems The number of items to pop
	 */
	public drop(numItems: number): void {
		if (this.stack.length < numItems) {
			throw new RuntimeError(
				VMStatus.StackUnderflow,
				"Stack only has " +
					this.stack.length +
					" items; cannot drop " +
					numItems +
					" from the stack"
			);
		}
		// Remove the specified number of items from the top of the stack
		this.stack.splice(-numItems, numItems);
	}

	/** Push a value to the stack */
	public push(value: RuntimeValue): void {
		this.stack.push(value);
	}

	/** Top value in the stack */
	public get top(): RuntimeValue {
		return this.stack[this.stack.length - 1];
	}

	public get frame(): Frame {
		return this.frames[this.frames.length - 1];
	}

	/** Returns true if the specified runtime value evaluates to true */
	public isTruthy(value: RuntimeValue): boolean {
		switch (value.type) {
			case RuntimeType.Boolean:
				return value === True;
			case RuntimeType.Number:
				return value.value !== 0 && value.value !== -0;
			case RuntimeType.String:
				return value.value !== "";
			case RuntimeType.Object:
				return value !== Nil;
			case RuntimeType.Function:
				return Number.isInteger(value.value);
		}
	}
}
