import { LoadedProgram } from "src/language/loaded-program";
import { OpCode } from "src/language/op-code";
import { Frame } from "src/vm/frame";
import { RuntimeError } from "src/vm/runtime-error";
import { RuntimeType } from "src/vm/runtime-type";
import { RuntimeValue } from "src/vm/runtime-value";
import { VMResult } from "src/vm/vm-result";
import { VMStatus } from "src/vm/vm-status";

interface Performance {
	now(): number;
}

const defaultPerformance = { now: () => 0 };

// Make constants for zero values since they are so widely used
const Nil: RuntimeValue = new RuntimeValue(RuntimeType.Pointer, null);
const Zero: RuntimeValue = new RuntimeValue(RuntimeType.Number, 0);
const Blank: RuntimeValue = new RuntimeValue(RuntimeType.String, "");
const True: RuntimeValue = new RuntimeValue(RuntimeType.Boolean, true);
const False: RuntimeValue = new RuntimeValue(RuntimeType.Boolean, false);

/** Virtual machine that runs code */
export class VirtualMachine {
	/** Current bytecode context */
	private program: LoadedProgram;
	/**
	 * Instruction pointer
	 *
	 * Always represents the index of the next instruction to be evaluated
	 */
	private get ip(): number {
		return this.frame.ip;
	}

	private set ip(value: number) {
		this.frame.ip = value;
	}

	/** Bytecode of the program */
	private get bytecode(): number[] {
		return this.program.bytecode;
	}

	/** Constant pool of the program */
	private get constantPool(): RuntimeValue[] {
		return this.program.constantPool;
	}

	/** Top value in the stack */
	private get top(): RuntimeValue {
		return this.stack[this.stack.length - 1];
	}

	/** Current stack frame for current function being executed */
	private get frame(): Frame {
		return this.frames[this.frames.length - 1];
	}

	/** Stack */
	private readonly stack: RuntimeValue[] = [];
	/** Stack frames */
	private readonly frames: Frame[] = [];

	constructor(program: LoadedProgram) {
		this.program = program;
		// Add the main stack frame:
		this.frames.push(new Frame(0, 0, program.numGlobals));
	}

	public run(performance: Performance = defaultPerformance): VMResult {
		const startTime = performance.now();
		try {
			while (true) {
				const instr = this.read();
				switch (instr) {
					default:
						throw new RuntimeError(
							VMStatus.InvalidInstruction,
							"Invalid instruction encountered: " + instr
						);
					case OpCode.Return: {
						// Grab the return value so that we can clean up the
						// locals below it
						const returnValue = this.stack.length > 0 ? this.pop() : Zero;
						// Clean up locals (or globals) created for this call
						// frame
						this.dropTo(this.frame.basePointer);
						if (this.frames.length === 1) {
							if (this.stack.length > 0) {
								throw new RuntimeError(
									VMStatus.UnknownFailure,
									"Internal error: Execution completed but stack still has values"
								);
							}
							return new VMResult(
								VMStatus.Success,
								returnValue,
								performance.now() - startTime
							);
						} else {
							// Push the return value back on to the stack
							this.push(returnValue);
							// Pop the call frame and resume execution at the
							// previous ip
							this.frames.pop();
						}
						break;
					}
					case OpCode.Const: {
						// Read a data value from the data section and push it
						// to the stack
						this.push(this.constant(this.read()));
						break;
					}
					case OpCode.Pop: {
						this.pop();
						break;
					}
					case OpCode.Drop: {
						// Drop the specified number of items from the top of the stack
						// (hopefully more efficient than repeated popping)
						this.drop(this.read());
						break;
					}
					case OpCode.Get: {
						// Get a local variable
						this.push(this.getLocal(this.read()));
						break;
					}
					case OpCode.Set: {
						// Set a local variable
						this.setLocal(this.read(), this.top.copy());
						break;
					}
					case OpCode.GetGlobal: {
						// Get a global variable
						this.push(this.get(this.read()));
						break;
					}
					case OpCode.SetGlobal: {
						this.set(this.read(), this.top.copy());
						break;
					}
					case OpCode.Neg: {
						// Negate the top value of the stack
						const top = this.pop();
						this.push(new RuntimeValue(top.type, -top.value));
						break;
					}
					case OpCode.Inc: {
						const index = this.read();
						const rv = this.getLocal(index);
						this.setLocal(index, new RuntimeValue(rv.type, rv.value + 1));
						break;
					}
					case OpCode.Dec: {
						const index = this.read();
						const rv = this.getLocal(index);
						this.setLocal(index, new RuntimeValue(rv.type, rv.value - 1));
						break;
					}
					case OpCode.IncGlobal: {
						const index = this.read();
						const rv = this.get(index);
						this.set(index, new RuntimeValue(rv.type, rv.value + 1));
						break;
					}
					case OpCode.DecGlobal: {
						const index = this.read();
						const rv = this.get(index);
						this.set(index, new RuntimeValue(rv.type, rv.value - 1));
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
					case OpCode.Less: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value < rhs.value ? True : False);
						break;
					}
					case OpCode.LessEqual: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value <= rhs.value ? True : False);
						break;
					}
					case OpCode.Greater: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value > rhs.value ? True : False);
						break;
					}
					case OpCode.GreaterEqual: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value >= rhs.value ? True : False);
						break;
					}
					case OpCode.Equal: {
						const rhs = this.pop();
						const lhs = this.pop();
						this.push(lhs.value === rhs.value ? True : False);
						break;
					}
					case OpCode.Unequal: {
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
					// Jumps
					case OpCode.Jmp: {
						const dest = this.read();
						this.ip += dest;
						break;
					}
					case OpCode.JmpFalse: {
						const dest = this.read();
						if (!this.isTruthy(this.top)) this.ip += dest;
						break;
					}
					case OpCode.JmpTrue: {
						const dest = this.read();
						if (this.isTruthy(this.top)) this.ip += dest;
						break;
					}
					case OpCode.JmpFalsePop: {
						const dest = this.read();
						if (!this.isTruthy(this.pop())) this.ip += dest;
						break;
					}
					case OpCode.JmpTruePop: {
						const dest = this.read();
						if (this.isTruthy(this.pop())) this.ip += dest;
						break;
					}
					case OpCode.Loop: {
						const dest = this.read();
						this.ip += dest;
						break;
					}
					case OpCode.Load: {
						this.push(new RuntimeValue(RuntimeType.Number, this.read()));
						break;
					}
					case OpCode.Tail:
					case OpCode.Call: {
						const numLocals = this.read();
						const dest = this.pop();
						if (dest.type !== RuntimeType.Number) {
							throw new RuntimeError(
								VMStatus.InvalidOperands,
								"Invalid invocation destination"
							);
						}
						const ip = dest.value as number;
						if (instr === OpCode.Call) {
							const basePointer = this.stack.length - numLocals;
							// Only push a new instruction if we are calling a function
							// If we are tail-calling a recursive function this is unnecessary
							this.frames.push(new Frame(ip, basePointer, numLocals));
						} else {
							this.ip = ip;
						}
						break;
					}
					// Collections
					case OpCode.MakeList: {
						const numItems = this.read();
						for (
							let i = this.stack.length - numItems;
							i < this.stack.length;
							i++
						) {}
						break;
					}
					case OpCode.MakeSet: {
						break;
					}
					case OpCode.MakeMap: {
						break;
					}
				}
				// Return if we reached the end
				if (this.ip >= this.bytecode.length) break;
			}
			return new VMResult(
				VMStatus.Success,
				this.top || Nil,
				performance.now() - startTime
			);
		} catch (e) {
			const code: VMStatus =
				e instanceof RuntimeError ? e.code : VMStatus.UnknownFailure;
			console.error(e);
			return new VMResult(code, this.top || Nil, performance.now() - startTime);
		}
	}

	/** Read the value at ip and increase ip by one */
	private read(): number {
		return this.bytecode[this.ip++];
	}

	/**
	 * Read the next value from the code and use it as an offset into the
	 * context data to return context data
	 */
	private constant(index: number): RuntimeValue {
		const data = this.constantPool[index];
		return new RuntimeValue(data.type, data.value);
	}

	/** Pop an item from the stack and return it if possible */
	private pop(): RuntimeValue {
		const top = this.stack.pop();
		if (!top) {
			throw new RuntimeError(VMStatus.StackUnderflow, "Stack underflow");
		}
		return top;
	}

	/**
	 * Pop the specified number of items off the stack and discard them
	 * @param numItems The number of items to drop
	 */
	private drop(numItems: number): void {
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

	/**
	 * Drops as many items off the stack as needed to reduce the stack back
	 * down to a specified length
	 * @param length The size the stack should be after dropping items
	 */
	private dropTo(length: number): void {
		if (length > this.stack.length) {
			throw new RuntimeError(
				VMStatus.StackUnderflow,
				"Stack only has " +
					this.stack.length +
					" items; cannot drop to a stack length of " +
					length
			);
		}
		if (length === this.stack.length) return;
		const numItems = this.stack.length - length;
		this.stack.splice(-numItems, numItems);
	}

	/** Push a value to the stack */
	private push(value: RuntimeValue): void {
		this.stack.push(value);
	}

	/** Get a shallow copy of a value from the stack via an absolute index */
	private get(index: number): RuntimeValue {
		const rv = this.stack[index];
		return new RuntimeValue(rv.type, rv.value);
	}

	/** Get a shallow copy of a value from the stack via a relative index */
	private getLocal(index: number): RuntimeValue {
		return this.get(this.frame.basePointer + index);
	}

	/** Set a specified absolute stack index to a copy of the specified value */
	private set(index: number, rv: RuntimeValue): void {
		this.stack[index] = new RuntimeValue(rv.type, rv.value);
	}

	/** Set a specified relative stack index to a copy of the specified value */
	private setLocal(index: number, rv: RuntimeValue): void {
		return this.set(index + this.frame.basePointer, rv);
	}

	/** Returns true if the specified runtime value evaluates to true */
	private isTruthy(value: RuntimeValue): boolean {
		switch (value.type) {
			case RuntimeType.Boolean:
				return value.value === true;
			case RuntimeType.Number:
				return value.value !== 0 && value.value !== -0;
			case RuntimeType.String:
				return value.value !== "";
			case RuntimeType.Pointer:
				return value.value !== null && value.value !== undefined;
		}
	}
}
