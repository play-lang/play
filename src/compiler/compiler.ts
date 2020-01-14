import { CompiledProgram } from "src/compiler/compiled-program";
import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { Context } from "src/language/context";
import { ContextLabels } from "src/language/context-labels";
import { FunctionInfo } from "src/language/function-info";
import { OpCode } from "src/language/op-code";
import { SymbolTable } from "src/language/symbol-table";
import { TokenType } from "src/language/token-type";
import { Visitor } from "src/language/visitor";
import { AssignmentExpressionNode } from "src/parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "src/parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "src/parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";
import { ElseStatementNode } from "src/parser/nodes/else-statement-node";
import { ExpressionStatementNode } from "src/parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "src/parser/nodes/function-declaration-node";
import { IdExpressionNode } from "src/parser/nodes/id-expression-node";
import { IfStatementNode } from "src/parser/nodes/if-statement-node";
import { InvocationExpressionNode } from "src/parser/nodes/invocation-expression-node";
import { PostfixExpressionNode } from "src/parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "src/parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "src/parser/nodes/primitive-expression-node";
import { ProgramNode } from "src/parser/nodes/program-node";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";
import { TernaryConditionalNode } from "src/parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";
import { RuntimeType } from "src/vm/runtime-type";
import { RuntimeValue } from "src/vm/runtime-value";

export class Compiler implements Visitor {
	/** Current bytecode context */
	public get context(): Context {
		return this.contexts.get(this.symbolTable)!;
	}
	/** Address of the last instruction */
	private get lastInstr(): number {
		return this.context.lastInstr;
	}

	/** Ast root to compile */
	public readonly ast: AbstractSyntaxTree;
	/** Constant pool preceding the code */
	public readonly constantPool: RuntimeValue[] = [];
	/**
	 * Maps constant values to their index in the constant pool to prevent duplicate entries
	 */
	public readonly constants: Map<any, number> = new Map();
	/**
	 * Contains the list of all compiled contexts after compilation
	 *
	 * The first instruction in the first context represents the program's
	 * entry point
	 */
	public readonly allContexts: Context[] = [];
	/** Maps symbol table instances to their respective bytecode context */
	public readonly contexts: Map<SymbolTable, Context> = new Map();

	/**
	 * Context names mapped to function nodes
	 * Should be provided from the parser
	 */
	public readonly functionTable: Map<string, FunctionInfo>;

	/** Global scope */
	private globalScope: SymbolTable;
	/** Symbol table for the current scope */
	private symbolTable: SymbolTable;
	/** Index of the next child scope to visit for each scope level */
	private childScopeIndices: number[] = [0];
	/** Number of scopes deep we are--used as an index to childScopeIndices */
	private scopeDepth: number = 0;
	/** Registers labels and patches jumps between contexts */
	private patcher: ContextLabels = new ContextLabels();
	/** Index of the next label to be generated */
	private labelId: number = 0;

	constructor(ast: AbstractSyntaxTree) {
		this.ast = ast;
		this.symbolTable = ast.env.symbolTable;
		this.globalScope = ast.env.symbolTable;
		this.contexts.set(
			this.symbolTable,
			this.createContext("main", this.symbolTable.totalEntries)
		);
		this.functionTable = ast.env.functionTable;
	}

	// MARK: Visitor

	public visitProgramNode(node: ProgramNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
	}

	public visitBlockStatementNode(node: BlockStatementNode): void {
		// Only enter and exit a scope if we're not inside a function block
		// Function block scope is handled for us elsewhere
		const isFunctionBlock = node.isFunctionBlock;
		if (!isFunctionBlock) this.enterScope();
		for (const statement of node.statements) {
			statement.accept(this);
		}
		if (!isFunctionBlock) {
			// We should clean up variables local to this block if we're just a
			// normal block -- functions get call frames which the VM uses to clean
			// up the stack for us
			const numLocalsToDrop = this.symbolTable.available;
			this.emit(OpCode.Drop, numLocalsToDrop);
			this.exitScope();
		}
	}

	public visitIfStatementNode(node: IfStatementNode): void {
		throw new Error("Method not implemented.");
	}

	public visitElseStatementNode(node: ElseStatementNode): void {
		throw new Error("Method not implemented.");
	}

	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		if (!this.symbolTable.entries.has(node.variableName)) {
			throw new Error(
				"Fatal error: Can't find name " +
					node.variableName +
					" in symbol table at scope depth" +
					this.scopeDepth
			);
		}
		if (!node.expr) {
			// There's no initializing expression for the variable, so emit
			// the "zero value" for that variable's type:
			switch (node.typeAnnotation[0]) {
				case "str":
					this.emit(OpCode.Blank);
					break;
				case "num":
					this.emit(OpCode.Zero);
					break;
				case "bool":
					this.emit(OpCode.False);
					break;
				default:
					this.emit(OpCode.Nil);
			}
			return;
		}
		node.expr.accept(this);
		// Mark the next variable as available in the symbol table
		this.symbolTable.available++;
	}

	public visitFunctionDeclarationNode(node: FunctionDeclarationNode): void {
		this.enterScope(node.info.name);
		this.symbolTable.available += node.info.parameters.length;
		node.block!.accept(this);
		if (!this.checkLastEmit(OpCode.Return)) {
			this.emit(OpCode.Return);
		}
		this.exitScope();
	}

	public visitIdExpressionNode(node: IdExpressionNode): void {
		if (node.usedAsFunction) {
			if (this.functionTable.has(node.name)) {
				// Register a function load address to be patched later
				const index = this.emit(OpCode.Load, -1) - 1;
				this.patcher.registerContextAddress(
					this.context,
					index,
					node.name
				);
			} else {
				throw new Error(
					"Cannot compile non-existent function: " + node.name
				);
			}
		} else {
			// Node represents a variable reference
			const scope = this.symbolTable.findScope(node.name);
			if (!scope) {
				throw new Error(
					"Cannot compile non-existent variable reference `" +
						node.name +
						"`"
				);
			}
			// Emit the proper instruction to push a copy of the variable's value
			// lower in the stack to the top of the stack
			const stackPos = this.symbolTable.stackPos(node.name)!;
			this.emit(
				scope.isGlobalScope ? OpCode.GetGlobal : OpCode.Get,
				stackPos
			);
		}
	}

	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		if (
			!(node.lhs instanceof IdExpressionNode) ||
			!this.functionTable.has(node.lhs.name)
		) {
			throw new Error(
				"Can't compile non-existent function invocation of " +
					node.lhs.token.lexeme
			);
		}
		// Arguments given to function go onto the stack
		for (const arg of node.args) {
			arg.accept(this);
		}
		// Load the function to the stack after loading the arguments
		node.lhs.accept(this);
		// Emit the call argument to invoke the function
		this.emit(OpCode.Call, node.args.length);
	}

	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {
		node.rhs.accept(this);
		switch (node.operatorType) {
			case TokenType.Bang:
				this.emit(OpCode.Not);
				break;
			case TokenType.Plus:
				// nop
				break;
			case TokenType.Minus:
				this.emit(OpCode.Neg);
				break;
			case TokenType.PlusPlus:
				this.emit(OpCode.Inc);
				break;
			case TokenType.MinusMinus:
				this.emit(OpCode.Dec);
				break;
		}
	}
	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {
		node.lhs.accept(this);
		switch (node.operatorType) {
			// Postfix operators
			case TokenType.PlusPlus:
				this.emit(OpCode.Inc);
				break;
			case TokenType.MinusMinus:
				this.emit(OpCode.Dec);
				break;
		}
	}
	public visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void {
		let value: any;
		let type: RuntimeType = RuntimeType.Object;
		switch (node.primitiveType) {
			case TokenType.String:
				value = node.primitiveValue;
				type = RuntimeType.String;
				break;
			case TokenType.Boolean:
				value = node.primitiveValue === "true" ? true : false;
				value ? this.emit(OpCode.True) : this.emit(OpCode.False);
				return;
			case TokenType.Number:
				value = Number.parseFloat(node.primitiveValue);
				type = RuntimeType.Number;
				break;
			case TokenType.Nil:
				this.emit(OpCode.Nil);
				return;
		}
		// Add the literal to the data section of the current context
		const index = this.constant(new RuntimeValue(type, value));
		// Have the machine push the value of the data at the specified data index
		// to the top of the stack when this instruction is encountered
		this.emit(OpCode.Const, index);
	}
	// Compile a binary operator expression
	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {
		node.lhs.accept(this);
		node.rhs.accept(this);
		switch (node.operatorType) {
			// Binary arithmetic operators
			case TokenType.Plus:
				this.emit(OpCode.Add);
				break;
			case TokenType.Minus:
				this.emit(OpCode.Sub);
				break;
			case TokenType.Asterisk:
				this.emit(OpCode.Mul);
				break;
			case TokenType.Slash:
				this.emit(OpCode.Div);
				break;
			case TokenType.Percent:
				this.emit(OpCode.Remain);
				break;
			case TokenType.Caret:
				this.emit(OpCode.Exp);
				break;
			// Binary relational operators
			case TokenType.LessThan:
				this.emit(OpCode.Less);
				break;
			case TokenType.LessThanEqual:
				this.emit(OpCode.LessEqual);
				break;
			case TokenType.GreaterThan:
				this.emit(OpCode.Greater);
				break;
			case TokenType.GreaterThanEqual:
				this.emit(OpCode.GreaterEqual);
				break;
			// Binary comparison operators
			case TokenType.EqualEqual:
				this.emit(OpCode.Equal);
				break;
			case TokenType.BangEqual:
				this.emit(OpCode.Unequal);
				break;
		}
	}

	// Visit binary logical operators and implement short-circuiting
	public visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void {
		node.lhs.accept(this);
		switch (node.operatorType) {
			// Binary logical operators
			case TokenType.And: {
				const addr = this.jumpIfFalse();
				this.emit(OpCode.Pop);
				node.rhs.accept(this);
				this.patch(addr, this.context.bytecode.length - addr - 1);
				this.emitLabel();
				break;
			}
			case TokenType.Or: {
				const addr = this.jumpIfTrue();
				this.emit(OpCode.Pop);
				node.rhs.accept(this);
				this.patch(addr, this.context.bytecode.length - addr - 1);
				this.emitLabel();
				break;
			}
		}
		return;
	}

	// Compiler ternary operator: true ? a : b
	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {
		node.predicate.accept(this);
		const falseAddr = this.jumpIfFalseAndPop();
		node.consequent.accept(this);
		const jumpAddr = this.jump();
		// Calculate the jump offset required to perform a short (relative)
		// jump and backpatch it
		const falseOffset = this.context.bytecode.length - falseAddr - 1;
		this.patch(falseAddr, falseOffset);
		// Set a label for the jump's destination
		this.emitLabel();
		node.alternate.accept(this);
		const jumpOffset = this.context.bytecode.length - jumpAddr - 1;
		this.patch(jumpAddr, jumpOffset);
		this.emitLabel();
	}

	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {
		node.rhs.accept(this);
		// TODO: Handle subscripts for collections
		if (node.lhs instanceof IdExpressionNode) {
			const stackPos = this.symbolTable.stackPos(node.lhs.name)!;
			this.emit(OpCode.Set, stackPos);
		} else {
			throw new Error(
				"Can't compile assignment of non-variable " + node.token.lexeme
			);
		}
	}

	public visitReturnStatementNode(node: ReturnStatementNode): void {
		if (!node.expr) {
			this.emit(OpCode.Nil);
		} else {
			node.expr.accept(this);
		}
		this.emit(OpCode.Return);
	}

	public visitExpressionStatementNode(node: ExpressionStatementNode): void {
		// An expression statement is an unused expression, so we pop it off when
		// we are finished with it. All expressions are guaranteed to push their
		// result to the stack, so this is safe
		// Even functions without a return value still return nil
		node.expr.accept(this);
		// Pop unused expression result off, unless its an assignment
		// which doesn't require a pop
		if (!(node.expr instanceof AssignmentExpressionNode)) {
			this.emit(OpCode.Pop);
		}
	}

	// MARK: Compiler Methods

	/**
	 * Compiles the program
	 * @returns The compiled program, ready to be linked
	 */
	public compile(): CompiledProgram {
		this.ast.root.accept(this);
		if (!this.checkLastEmit(OpCode.Return)) this.emit(OpCode.Return);
		return new CompiledProgram(
			this.allContexts,
			this.constantPool,
			this.symbolTable.totalEntries,
			this.patcher
		);
	}

	/**
	 * Checks to see if the last emitted bytecode in the current context is the
	 * specified opcode
	 * @param opcode The opcode to check
	 */
	public checkLastEmit(opcode: number): boolean {
		if (this.context.bytecode[this.lastInstr] === opcode) {
			return true;
		}
		return false;
	}

	/**
	 * Emit a bytecode opcode and an optional parameter,
	 * returning the index of the last emitted byte
	 *
	 * Optionally specify which context to emit an instruction to
	 * @param opcode The instruction to emit
	 * @param param A numeric parameter, if any, to emit for the instruction
	 * @param context A context, if any, to emit to. Defaults to the current
	 * context of the compiler based on scope
	 */
	public emit(
		opcode: OpCode,
		param?: number,
		context: Context = this.context
	): number {
		return context.emit(opcode, param);
	}

	public jump(): number {
		return this.emit(OpCode.Jmp, 0);
	}

	public jumpIfFalse(): number {
		return this.emit(OpCode.JmpFalse, 0);
	}

	public jumpIfTrue(): number {
		return this.emit(OpCode.JmpTrue, 0);
	}

	public jumpIfFalseAndPop(): number {
		return this.emit(OpCode.JmpFalsePop, 0);
	}

	public jumpIfTrueAndPop(): number {
		return this.emit(OpCode.JmpTruePop, 0);
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
	}

	/**
	 * Output a label at the last instruction
	 */
	public emitLabel(): void {
		this.context.setLabel(this.context.bytecode.length, this.labelId++);
	}

	/**
	 * Enter the next child scope of the current symbol table
	 *
	 * @param [contextName] If provided, this will create a new compilation
	 * context for the added scope with the specified name
	 */
	private enterScope(contextName: string = ""): void {
		const context = this.context;
		const childScopeIndex = this.childScopeIndices[this.scopeDepth++]++;
		this.childScopeIndices.push(0);
		this.symbolTable = this.symbolTable.scopes[childScopeIndex];
		this.symbolTable.available = 0;
		// Add a context entry in the map of symbol tables to contexts
		this.contexts.set(
			this.symbolTable,
			contextName === ""
				? context
				: this.createContext(contextName, this.symbolTable.totalEntries)
		);
	}

	/**
	 * Exits the current scope
	 * @returns The last scope
	 */
	private exitScope(): SymbolTable {
		// Go back up the scope chain
		this.scopeDepth--;
		this.childScopeIndices.pop();
		const symbolTable = this.symbolTable;
		this.symbolTable = this.symbolTable.enclosingScope || this.globalScope;
		return symbolTable;
	}

	/**
	 * Creates a new context and adds it to the list of contexts so that
	 * they can be given to the linker later
	 * @param contextName Name of the context (should be the function name)
	 * @param constantPool Shared constant pool
	 * @param constants Shared constants look-up map for avoiding duplicates
	 */
	private createContext(contextName: string, numLocals: number): Context {
		const context = new Context(contextName, numLocals, [], this.labelId++);
		this.allContexts.push(context);
		this.patcher.prepare(this.context);
		return context;
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
}
