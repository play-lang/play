import { CompiledProgram } from "src/compiler/compiled-program";
import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { Context } from "src/language/context/context";
import { ContextLabels } from "src/language/context/context-labels";
import { FunctionInfo } from "src/language/function-info";
import { Expression, Node } from "src/language/node";
import { OpCode } from "src/language/op-code";
import { Scope } from "src/language/symbol-table/scope";
import { SymbolTable } from "src/language/symbol-table/symbol-table";
import { TokenType } from "src/language/token/token-type";
import { Visitor } from "src/language/visitor";
import { AssignmentExpressionNode } from "src/parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "src/parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "src/parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";
import { DoWhileStatementNode } from "src/parser/nodes/do-while-statement-node";
import { ElseStatementNode } from "src/parser/nodes/else-statement-node";
import { ExpressionStatementNode } from "src/parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "src/parser/nodes/function-declaration-node";
import {
	IdExpressionNode,
	IdExpressionUse,
} from "src/parser/nodes/id-expression-node";
import { IfStatementNode } from "src/parser/nodes/if-statement-node";
import { IndexExpressionNode } from "src/parser/nodes/index-expression-node";
import { InvocationExpressionNode } from "src/parser/nodes/invocation-expression-node";
import { ListNode } from "src/parser/nodes/list-node";
import { MapNode } from "src/parser/nodes/map-node";
import { MemberAccessExpressionNode } from "src/parser/nodes/member-access-expression-node";
import { ModelNode } from "src/parser/nodes/model-node";
import { PostfixExpressionNode } from "src/parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "src/parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "src/parser/nodes/primitive-expression-node";
import { ProgramNode } from "src/parser/nodes/program-node";
import { ProtocolNode } from "src/parser/nodes/protocol-node";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";
import { TernaryConditionalNode } from "src/parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";
import { WhileStatementNode } from "src/parser/nodes/while-statement-node";
import { RuntimeType } from "src/vm/runtime-type";
import { RuntimeValue } from "src/vm/runtime-value";

export class CompilerOptions {
	constructor(
		/** True if the compiler should optimize tail-recursive calls */
		public readonly optimizeTailRecursiveCalls: boolean = true
	) {}
}

export class Compiler implements Visitor {
	/** Current bytecode context */
	public get context(): Context {
		return this.contexts.get(this.scope)!;
	}

	/** Function table */
	public get functionTable(): Map<string, FunctionInfo> {
		return this.ast.env.functionTable;
	}

	/** Symbol table */
	public get symbolTable(): SymbolTable {
		return this.ast.env.symbolTable;
	}

	/** Current scope */
	private get scope(): Scope {
		return this.ast.env.symbolTable.scope;
	}

	/**
	 * Contains the list of all compiled contexts after compilation
	 *
	 * The first instruction in the first context represents the program's
	 * entry point
	 */
	public readonly allContexts: Context[] = [];
	/** Constant pool preceding the code */
	public readonly constantPool: RuntimeValue[] = [];
	/**
	 * Maps constant values to their index in the constant pool to prevent duplicate entries
	 */
	public readonly constants: Map<any, number> = new Map();
	/** Map of bytecode contexts keyed by scope */
	public readonly contexts: Map<Scope, Context> = new Map();
	/** Map of scopes keyed by context name */
	public readonly functionScopes: Map<string, Scope> = new Map();

	/** Index of the next label to be generated */
	private labelId: number = 0;
	/** Registers labels and patches jumps between contexts */
	private patcher: ContextLabels = new ContextLabels();

	/**
	 * Compile the parser's output into bytecode
	 *
	 * Be sure to run the type checker and ensure that there are no errors before
	 * asking the compiler to compile
	 *
	 * @param ast The abstract syntax tree containing the parse tree and
	 * environment
	 * @param options Compiler settings
	 */
	constructor(
		/** Abstract syntax tree and parsing environment */
		public readonly ast: AbstractSyntaxTree,
		/** Compiler options */
		public readonly options: CompilerOptions = new CompilerOptions()
	) {
		this.ast = ast;
		this.symbolTable.reset();
		this.contexts.set(
			this.scope,
			this.createContext("(main)", this.scope.totalEntries)
		);
		this.functionScopes.set("(main)", this.scope);
	}

	/**
	 * Output the necessary code to properly update a variable contained
	 * in the specified node to the value at the top of the stack
	 * @param node The node containing the variable to mutate
	 */
	public assignToNode(node: Expression): void {
		if (node instanceof IdExpressionNode) {
			const scope = this.scope.findScope(node.name);
			const stackPos = this.scope.stackPos(node.name)!;
			this.context.emit(
				scope?.isGlobalScope ? OpCode.SetGlobal : OpCode.Set,
				stackPos
			);
		} else if (node instanceof IndexExpressionNode) {
			// Assign to a child field on a collection value stored in the heap
			// (this involves pointer lookups)
			node.accept(this);
		} else {
			throw new Error("Cannot assign to " + node.token.lexeme);
		}
	}

	/**
	 * Checks to see if the last emitted bytecode in the current context is the
	 * specified opcode
	 * @param opcode The opcode to check
	 */
	public checkLastEmit(opcode: number): boolean {
		if (this.context.lastInstr === opcode) {
			return true;
		}
		return false;
	}

	// MARK: Compiler Methods

	/**
	 * Compiles the program
	 * @returns The compiled program, ready to be linked
	 */
	public compile(): CompiledProgram {
		this.ast.root.accept(this);
		if (!this.checkLastEmit(OpCode.Return)) {
			this.context.emit(OpCode.Return);
		}
		return new CompiledProgram(
			this.allContexts,
			this.constantPool,
			this.scope.totalEntries,
			this.patcher
		);
	}

	/**
	 * Output a label at the last instruction and return the index of the
	 * last byte
	 * @returns Index of the last byte
	 */
	public emitLabel(): number {
		return this.context.emitLabel(this.labelId++);
	}

	/**
	 * Output the appropriate instructions for incrementing or decrementing
	 * a l-value referenced by a node
	 * @param node The node containing the expression to be
	 * incremented/decremented
	 * @param shouldIncrement True if instructions for incrementing should be
	 * output, false for decrementing
	 */
	public incrementOrDecrement(
		node: Expression,
		shouldIncrement: boolean
	): void {
		if (node instanceof IdExpressionNode) {
			const scope = this.scope.findScope(node.name);
			const stackPos = this.scope.stackPos(node.name)!;
			if (scope?.isGlobalScope) {
				this.context.emit(
					shouldIncrement ? OpCode.IncGlobal : OpCode.DecGlobal,
					stackPos
				);
			} else {
				this.context.emit(shouldIncrement ? OpCode.Inc : OpCode.Dec, stackPos);
			}
		} else if (node instanceof IndexExpressionNode) {
			node.lhs.accept(this);
			node.index.accept(this);
			this.context.emit(shouldIncrement ? OpCode.IncHeap : OpCode.DecHeap);
		} else {
			throw new Error("Can't mutate non-variable" + node.token.lexeme);
		}
	}

	/**
	 * Patches a bytecode address reference in the specified context
	 * @param index The index of the bytecode parameter to replace
	 * @param destOffset The jump's destination as an offset to the jump's ip
	 * @param [context] The context to patch the specified address in
	 */
	public patch(
		index: number,
		destOffset: number,
		context: Context = this.context
	): void {
		context.bytecode[index] = destOffset;
		this.emitLabel();
	}

	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {
		this.accept(node.rhs);
		// Do not visit the left-hand side, as this could push stuff to the stack
		// we don't need (it would be a read operation instead of an assign)
		//
		// Instead, output our own special assignment instructions based on the
		// type of the left-hand-side value given
		// This is the magic where l-values are handled appropriately!
		this.assignToNode(node.lhs);
	}

	// Compile a binary operator expression
	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {
		this.accept(node.lhs);
		this.accept(node.rhs);
		switch (node.operatorType) {
			// Binary arithmetic operators
			case TokenType.Plus:
				this.context.emit(OpCode.Add);
				break;
			case TokenType.Minus:
				this.context.emit(OpCode.Sub);
				break;
			case TokenType.Asterisk:
				this.context.emit(OpCode.Mul);
				break;
			case TokenType.Slash:
				this.context.emit(OpCode.Div);
				break;
			case TokenType.Percent:
				this.context.emit(OpCode.Remain);
				break;
			case TokenType.Caret:
				this.context.emit(OpCode.Exp);
				break;
			// Binary relational operators
			case TokenType.LessThan:
				this.context.emit(OpCode.Less);
				break;
			case TokenType.LessThanEqual:
				this.context.emit(OpCode.LessEqual);
				break;
			case TokenType.GreaterThan:
				this.context.emit(OpCode.Greater);
				break;
			case TokenType.GreaterThanEqual:
				this.context.emit(OpCode.GreaterEqual);
				break;
			// Binary comparison operators
			case TokenType.EqualEqual:
				this.context.emit(OpCode.Equal);
				break;
			case TokenType.BangEqual:
				this.context.emit(OpCode.Unequal);
				break;
		}
	}

	// Visit binary logical operators and implement short-circuiting
	public visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void {
		this.accept(node.lhs);
		switch (node.operatorType) {
			// Binary logical operators
			case TokenType.And: {
				const addr = this.context.jumpIfFalse();
				this.context.emit(OpCode.Pop);
				this.accept(node.rhs);
				this.patch(addr, this.context.bytecode.length - addr - 1);
				break;
			}
			case TokenType.Or: {
				const addr = this.context.jumpIfTrue();
				this.context.emit(OpCode.Pop);
				this.accept(node.rhs);
				this.patch(addr, this.context.bytecode.length - addr - 1);
				break;
			}
		}
		return;
	}

	public visitBlockStatementNode(node: BlockStatementNode): void {
		// Only enter and exit a scope if we're not inside a function block
		// Function block scope is handled for us elsewhere
		const isFunctionBlock = node.isFunctionBlock;
		if (!isFunctionBlock) this.enterScope();
		for (const statement of node.statements) {
			this.accept(statement);
		}
		if (!isFunctionBlock) {
			// We should clean up variables local to this block if we're just a
			// normal block -- functions get call frames which the VM uses to clean
			// up the stack for us
			this.dropLocals(this.scope.available);
			this.exitScope();
		}
	}

	public visitDoWhileStatementNode(node: DoWhileStatementNode): void {
		const dest = this.emitLabel();
		this.accept(node.block);
		this.accept(node.condition);
		const falseAddr = this.context.jumpIfFalseAndPop();
		this.context.loop(dest - (this.context.bytecode.length + 2));
		const offset = this.context.bytecode.length - falseAddr - 1;
		this.patch(falseAddr, offset);
	}

	public visitElseStatementNode(node: ElseStatementNode): void {
		let shouldJump = false;
		let falseAddr: number = 0;
		if (node.expr) {
			this.accept(node.expr);
			falseAddr = this.context.jumpIfFalseAndPop();
			shouldJump = true;
		}
		this.accept(node.block);
		if (shouldJump) {
			const falseOffset = this.context.bytecode.length - falseAddr - 1;
			this.patch(falseAddr, falseOffset);
		}
	}

	public visitExpressionStatementNode(node: ExpressionStatementNode): void {
		// An expression statement is an unused expression, so we pop it off when
		// we are finished with it. All expressions are guaranteed to push their
		// result to the stack, so this is safe
		// Even functions without a return value still return nil
		this.accept(node.expr);
		// Pop unused expression result off, unless its an assignment
		// which doesn't require a pop
		if (!(node.expr instanceof AssignmentExpressionNode)) {
			this.context.emit(OpCode.Pop);
		}
	}

	public visitFunctionDeclarationNode(node: FunctionDeclarationNode): void {
		this.enterScope(node.info.name);
		this.scope.available += node.info.parameters.length;
		this.accept(node.block!);
		if (!this.checkLastEmit(OpCode.Return)) {
			this.context.emit(OpCode.Nil);
			this.context.emit(OpCode.Return);
		}
		this.exitScope();
	}

	public visitIdExpressionNode(node: IdExpressionNode): void {
		if (node.use === IdExpressionUse.Function) {
			if (this.functionTable.has(node.name)) {
				// Register a function load address to be patched later
				const index = this.context.emit(OpCode.Load, -1) - 1;
				this.patcher.registerContextAddress(this.context, index, node.name);
			} else {
				throw new Error("Cannot compile non-existent function: " + node.name);
			}
		} else if (node.use === IdExpressionUse.Variable) {
			// Node represents a variable reference
			const scope = this.scope.findScope(node.name);
			if (!scope) {
				throw new Error(
					"Cannot compile non-existent variable reference `" + node.name + "`"
				);
			}
			// Emit the proper instruction to push a copy of the variable's value
			// lower in the stack to the top of the stack
			const stackPos = this.scope.stackPos(node.name)!;
			this.context.emit(
				scope.isGlobalScope ? OpCode.GetGlobal : OpCode.Get,
				stackPos
			);
		}
	}

	public visitIfStatementNode(node: IfStatementNode): void {
		// Compile if expression predicate
		this.accept(node.predicate);
		const falseAddr = this.context.jumpIfFalseAndPop();
		// Compile main block
		this.accept(node.consequent);
		// Calculate the jump offset required to perform a short (relative)
		// jump and backpatch it
		const falseOffset = this.context.bytecode.length - falseAddr - 1;
		this.patch(falseAddr, falseOffset);
		for (const alternate of node.alternates) {
			this.accept(alternate);
		}
	}

	public visitIndexExpressionNode(node: IndexExpressionNode): void {
		this.accept(node.lhs);
		this.accept(node.index);
		this.context.emit(node.lValue ? OpCode.SetHeap : OpCode.Index);
	}

	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		if (!(node.lhs instanceof IdExpressionNode)) {
			throw new Error("Can't compile invocation for " + node.lhs.token.lexeme);
		}
		const isNative = typeof node.nativeFunctionIndex === "number";
		if (node.receiver) {
			// Compile a method call
			if (isNative) {
				// Native method call
			} else {
				// Normal method call
				throw new Error("Only native methods can be compiled currently");
			}
		} else {
			// Compile a global function call

			if (isNative) {
				// If we are compiling a native function call, make sure the index
				// of the native function provided is valid
				if (!this.ast.env.host.functions[node.nativeFunctionIndex!]) {
					throw new Error(
						"Cannot resolve native function " + node.nativeFunctionIndex!
					);
				}
			}

			// Figure out how many parameters the function is supposed to have
			// If it is a user function, look it up in the environment signatures
			// If it is a native function, look it up in the environment host
			// extensions that contain the native functions
			//
			// Todo: Clean this up by providing easier access to function information
			const numParameters = isNative
				? this.ast.env.host.functions[node.nativeFunctionIndex!].arity
				: this.functionTable.get(node.lhs.name)!.parameters.length;

			// Ensure that the number of arguments in this call match...the
			// type checker should have caught this beforehand but it's okay
			// to double-check
			if (node.args.length !== numParameters) {
				throw new Error(
					"Can't compile tail recursive invocation with " +
						"incorrect number of arguments" +
						node.lhs.token.lexeme
				);
			}
			const optimize =
				!isNative &&
				this.options.optimizeTailRecursiveCalls &&
				node.isTailRecursive;
			// Arguments given to function go onto the stack
			for (const arg of node.args) {
				this.accept(arg);
			}
			if (optimize) {
				for (let i = node.args.length - 1; i >= 0; i--) {
					// Update the local variable that the argument maps to inside
					// the current call frame
					this.context.emit(OpCode.Set, i);
					// Pop the argument now that the local variable is saved
					this.context.emit(OpCode.Pop);
				}
			}
			// Load the function to the stack after loading the arguments
			this.accept(node.lhs);
			if (isNative) {
				// Emit instruction for native function call
				this.context.emit(OpCode.CallNative, node.nativeFunctionIndex!);
			} else {
				// Emit the proper calling instruction to invoke the user function
				this.context.emit(
					optimize ? OpCode.Tail : OpCode.Call,
					node.args.length
				);
			}
		}
	}

	public visitListNode(node: ListNode): void {
		for (const member of node.members) {
			this.accept(member);
		}
		this.context.emit(OpCode.MakeList, node.members.length);
	}

	public visitMapNode(node: MapNode): void {
		for (let i = 0; i < node.keys.length; i++) {
			this.accept(node.keys[i]);
			this.accept(node.values[i]);
		}
		this.context.emit(OpCode.MakeMap, node.keys.length);
	}

	public visitMemberAccessExpressionNode(
		node: MemberAccessExpressionNode
	): void {
		node.lhs.accept(this);
		node.member.accept(this);
		// TODO: Compile member access expressions
	}

	public visitModelNode(node: ModelNode): void {
		// TODO: Compile model declarations
	}

	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {
		this.accept(node.lhs);
		switch (node.operatorType) {
			// Postfix operators
			case TokenType.PlusPlus:
				this.incrementOrDecrement(node.lhs, true);
				break;
			case TokenType.MinusMinus:
				this.incrementOrDecrement(node.lhs, false);
				break;
		}
	}

	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {
		switch (node.operatorType) {
			case TokenType.Bang:
				this.accept(node.rhs);
				this.context.emit(OpCode.Not);
				break;
			case TokenType.Plus:
				this.accept(node.rhs);
				break;
			case TokenType.Minus:
				this.accept(node.rhs);
				this.context.emit(OpCode.Neg);
				break;
			case TokenType.PlusPlus:
			case TokenType.MinusMinus:
				this.incrementOrDecrement(
					node.rhs,
					node.operatorType === TokenType.PlusPlus
				);
				// To gain prefix functionality we must visit the rhs after
				// increment/decrementing the variable's value
				this.accept(node.rhs);
				break;
		}
	}

	public visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void {
		let value: any;
		let type: RuntimeType = RuntimeType.Pointer;
		switch (node.primitiveType) {
			case TokenType.String:
				value = node.primitiveValue;
				type = RuntimeType.String;
				break;
			case TokenType.Boolean:
				value = node.primitiveValue === "true" ? true : false;
				value
					? this.context.emit(OpCode.True)
					: this.context.emit(OpCode.False);
				return;
			case TokenType.Number:
				value = Number.parseFloat(node.primitiveValue);
				type = RuntimeType.Number;
				break;
			case TokenType.Nil:
				this.context.emit(OpCode.Nil);
				return;
		}
		// Add the literal to the data section of the current context
		const index = this.constant(new RuntimeValue(type, value));
		// Have the machine push the value of the data at the specified data index
		// to the top of the stack when this instruction is encountered
		this.context.emit(OpCode.Const, index);
	}

	public visitProgramNode(node: ProgramNode): void {
		for (const statement of node.statements) {
			this.accept(statement);
		}
	}

	public visitProtocolNode(node: ProtocolNode): void {
		// TODO: Compile protocol declarations
	}

	public visitReturnStatementNode(node: ReturnStatementNode): void {
		if (!node.expr) {
			this.context.emit(OpCode.Nil);
		} else {
			this.accept(node.expr);
		}
		this.context.emit(OpCode.Return);
	}

	// Compiler ternary operator: true ? a : b
	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {
		this.accept(node.predicate);
		const falseAddr = this.context.jumpIfFalseAndPop();
		this.accept(node.consequent);
		const jumpAddr = this.context.jump();
		// Calculate the jump offset required to perform a short (relative)
		// jump and backpatch it
		const falseOffset = this.context.bytecode.length - falseAddr - 1;
		this.patch(falseAddr, falseOffset);
		// Set a label for the jump's destination
		this.accept(node.alternate);
		const jumpOffset = this.context.bytecode.length - jumpAddr - 1;
		this.patch(jumpAddr, jumpOffset);
	}

	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		if (!this.scope.entries.has(node.variableName)) {
			throw new Error(
				"Fatal error: Can't find name " + node.variableName + " in symbol table"
			);
		}
		if (!node.expr) {
			// There's no initializing expression for the variable, so emit
			// the "zero value" for that variable's type:
			switch (node.typeAnnotation[0]) {
				case "str":
					this.context.emit(OpCode.Blank);
					break;
				case "num":
					this.context.emit(OpCode.Zero);
					break;
				case "bool":
					this.context.emit(OpCode.False);
					break;
				default:
					this.context.emit(OpCode.Nil);
			}
			return;
		}
		this.accept(node.expr);
		// Mark the next variable as available in the scope since it has now
		// been declared
		this.scope.available++;
	}

	public visitWhileStatementNode(node: WhileStatementNode): void {
		const dest = this.emitLabel();
		this.accept(node.condition);
		const falseAddr = this.context.jumpIfFalseAndPop();
		this.accept(node.block);
		// Calculate the distance from the emitted loop instruction
		// to the destination instruction...we have to add 2 because the loop
		// instruction itself takes up two codes
		this.context.loop(dest - (this.context.bytecode.length + 2));
		const falseOffset = this.context.bytecode.length - falseAddr - 1;
		this.patch(falseAddr, falseOffset);
	}

	/**
	 * Have the compiler have a node visit the compiler (ahem) if and only if
	 * the node is not marked as unreachable
	 * @param node The node that accepts the compiler
	 */
	private accept(node: Node): void {
		if (!node.isDead) node.accept(this);
	}

	/**
	 * Creates a new data constant for a literal and adds it to the
	 * constant pool
	 *
	 * @returns The index to the constant in the constant pool
	 * @param value The constant's runtime value
	 */
	private constant(value: RuntimeValue): number {
		if (this.constants.has(value.value)) {
			return this.constants.get(value.value)!;
		} else {
			// Unique, new constant
			this.constantPool.push(value);
			this.constants.set(value.value, this.constantPool.length - 1);
			return this.constantPool.length - 1;
		}
	}

	/**
	 * Creates a new context and adds it to the list of contexts so that
	 * they can be given to the linker later
	 * @param contextName Name of the context (should be the function name)
	 * @param constants Shared constants look-up map for avoiding duplicates
	 */
	private createContext(contextName: string, numLocals: number): Context {
		const context = new Context(contextName, numLocals, [], this.labelId++);
		this.allContexts.push(context);
		this.patcher.prepare(this.context);
		return context;
	}

	/**
	 * Drop the specified number of local variables off of the stack
	 * @param numLocalsToDrop The number of locals that should be dropped
	 */
	private dropLocals(numLocalsToDrop: number): void {
		if (numLocalsToDrop > 0) {
			this.context.emit(OpCode.Drop, numLocalsToDrop);
		}
	}

	/**
	 * Enter the next child scope of the current scope
	 *
	 * @param [contextName] If provided, this will create a new compilation
	 * context for the added scope with the specified name
	 */
	private enterScope(contextName: string = ""): void {
		// Capture the current context before mutating the way it is computed
		const context = this.context;
		// Use our symbol table to navigate into the current scope
		this.symbolTable.enterScope();
		// Make sure that the number of variables declared in this scope is reset
		// so that we can calculate stack offsets correctly
		this.scope.available = 0;
		// Add a context entry
		this.contexts.set(
			this.scope,
			contextName
				? this.createContext(contextName, this.scope.totalEntries)
				: context
		);
		if (contextName) {
			this.functionScopes.set(contextName, this.scope);
		}
	}

	/**
	 * Exits the current scope
	 * @returns The last scope
	 */
	private exitScope(): Scope {
		// Go back up the scope chain
		return this.symbolTable.exitScope();
	}
}
