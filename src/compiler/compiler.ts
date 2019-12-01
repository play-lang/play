import { JumpPatcher } from "../jump-patcher/jump-patcher";
import { AbstractSyntaxTree } from "../language/abstract-syntax-tree";
import { ActionInfo } from "../language/action-info";
import { Context } from "../language/context";
import { OpCode } from "../language/op-code";
import SymbolTable from "../language/symbol-table";
import { TokenType } from "../language/token-type";
import { Visitor } from "../language/visitor";
import { ActionDeclarationNode } from "../parser/nodes/action-declaration-node";
import { ActionReferenceNode } from "../parser/nodes/action-reference-node";
import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "../parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { InvocationExpressionNode } from "../parser/nodes/invocation-operator-parselet";
import { LiteralExpressionNode } from "../parser/nodes/literal-expression-node";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { ProgramNode } from "../parser/nodes/program-node";
import { ReturnStatementNode } from "../parser/nodes/return-statement-node";
import { ReturnValueStatementNode } from "../parser/nodes/return-value-statement-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";
import { VariableReferenceNode } from "../parser/nodes/variable-reference-node";
import { RuntimeType } from "../vm/runtime-type";
import { RuntimeValue } from "../vm/runtime-value";
import { CompiledProgram } from "./compiled-program";

export class Compiler extends Visitor {
	/** Current bytecode context */
	public get context(): Context {
		return this.contexts.get(this.symbolTable)!;
	}

	/** Ast root to compile */
	public readonly ast: AbstractSyntaxTree;
	/** Constant pool preceding the code */
	public readonly constantPool: RuntimeValue[] = [];
	/**
	 * Maps constant values to their index in the constant pool to prevent duplicate entries
	 */
	public readonly constants: Map<any, number> = new Map();
	/** Contains the list of all compiled contexts after compilation */
	public readonly allContexts: Context[] = [];
	/** Maps symbol table instances to their respective bytecode context */
	public readonly contexts: Map<SymbolTable, Context> = new Map();

	/**
	 * Context names mapped to action nodes
	 * Should be provided from the parser
	 */
	public readonly actionTable: Map<string, ActionInfo>;

	/** Global scope */
	private globalScope: SymbolTable;
	/** Symbol table for the current scope */
	private symbolTable: SymbolTable;
	/** Index of the next child scope to visit for each scope level */
	private childScopeIndices: number[] = [0];
	/** Number of scopes deep we are--used as an index to childScopeIndices */
	private scopeDepth: number = 0;
	/** Registers labels and patches jumps between contexts */
	private jumpPatcher: JumpPatcher = new JumpPatcher();

	constructor(ast: AbstractSyntaxTree) {
		super();
		this.ast = ast;
		this.symbolTable = ast.symbolTable;
		this.globalScope = ast.symbolTable;
		this.contexts.set(
			this.symbolTable,
			this.createContext("main", this.constantPool, this.constants)
		);
		this.actionTable = ast.actionTable;
	}

	// MARK: Visitor

	public visitProgramNode(node: ProgramNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
	}

	public visitBlockStatementNode(node: BlockStatementNode): void {
		// Only enter and exit a scope if we're not inside an action block
		// Action block scope is handled for us elsewhere
		const isActionBlock = node.isActionBlock;
		if (!isActionBlock) this.enterScope();
		for (const statement of node.statements) {
			statement.accept(this);
		}
		if (!isActionBlock) this.exitScope();
	}

	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		if (!this.symbolTable.lookup(node.name)) {
			throw new Error(
				"Fatal error: Can't find name " +
					node.name +
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
		// TODO: Push local value to stack inside whatever block
	}

	public visitVariableReferenceNode(node: VariableReferenceNode): void {}

	public visitActionDeclarationNode(node: ActionDeclarationNode): void {
		this.enterScope(node.info.name);
		node.block!.accept(this);
		if (this.checkLastEmit(OpCode.Return)) {
			// If the last emitted instruction wasn't a return code, we need to
			// emit one for them
			this.emit(OpCode.Return);
		}
		this.exitScope();
	}

	public visitActionReferenceNode(node: ActionReferenceNode): void {
		// We can use the patcher to patch a push instruction, not just a jump!
		// So that's what we'll do
		const offset = this.emit(OpCode.Load, -1) - 1;
		this.jumpPatcher.registerContextJump(this.context, offset, node.actionName);
	}

	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		if (!(node.lhs instanceof ActionReferenceNode)) {
			throw new Error("Can't invoke something that isn't an action");
		}
		node.lhs.accept(this);
		// Arguments given to function go onto the stack
		for (const arg of node.args) {
			arg.accept(this);
		}
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
	public visitLiteralExpressionNode(node: LiteralExpressionNode): void {
		let value: any;
		let type: RuntimeType = RuntimeType.Object;
		switch (node.literalType) {
			case TokenType.String:
				value = node.literalValue;
				type = RuntimeType.String;
				break;
			case TokenType.Boolean:
				value = node.literalValue === "true" ? true : false;
				value ? this.emit(OpCode.True) : this.emit(OpCode.False);
				return;
			case TokenType.Number:
				value = Number.parseFloat(node.literalValue);
				type = RuntimeType.Number;
				break;
			case TokenType.Nil:
				this.emit(OpCode.Nil);
				return;
		}
		// Add the literal to the data section of the current context
		const index = this.context.constant(new RuntimeValue(type, value));
		// Have the machine push the value of the data at the specified data index
		// to the top of the stack when this instruction is encountered
		this.emit(OpCode.Constant, index);
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
				this.emit(OpCode.LessThan);
				break;
			case TokenType.LessThanEqual:
				this.emit(OpCode.LessThanEqual);
				break;
			case TokenType.GreaterThan:
				this.emit(OpCode.GreaterThan);
				break;
			case TokenType.GreaterThanEqual:
				this.emit(OpCode.GreaterThanEqual);
				break;
			// Binary comparison operators
			case TokenType.EqualEqual:
				this.emit(OpCode.Equality);
				break;
			case TokenType.BangEqual:
				this.emit(OpCode.Inequality);
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
				const skipJump = this.jumpIfFalse();
				this.emit(OpCode.Pop);
				node.rhs.accept(this);
				this.patch(this.context, skipJump, this.context.bytecode.length);
				break;
			}
			case TokenType.Or: {
				const skipJump = this.jumpIfTrue();
				this.emit(OpCode.Pop);
				node.rhs.accept(this);
				this.patch(this.context, skipJump, this.context.bytecode.length);
				break;
			}
		}
		return;
	}

	// Compiler ternary operator: true ? a : b
	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {
		node.predicate.accept(this);
		const falseJump = this.jumpIfFalse();
		node.consequent.accept(this);
		const jump = this.jump();
		this.patch(this.context, falseJump, this.context.bytecode.length);
		node.alternate.accept(this);
		this.patch(this.context, jump, this.context.bytecode.length);
	}

	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {}
	public visitReturnStatementNode(node: ReturnStatementNode): void {
		this.emit(OpCode.Return);
	}
	public visitReturnValueStatementNode(node: ReturnValueStatementNode): void {
		node.expr.accept(this);
		this.emit(OpCode.ReturnValue);
	}

	// MARK: Compiler Methods

	/**
	 * Compiles the program
	 * @returns The compiled program, ready to be linked
	 */
	public compile(): CompiledProgram {
		this.ast.root.accept(this);
		this.emit(OpCode.Return);
		return new CompiledProgram(
			this.allContexts,
			this.constantPool,
			this.jumpPatcher
		);
	}

	/**
	 * Checks to see if the last emitted bytecode in the current context is the
	 * specified opcode
	 * @param opcode The opcode to check
	 */
	public checkLastEmit(opcode: number): boolean {
		if (this.context.bytecode[this.context.bytecode.length - 1] === opcode) {
			return true;
		}
		return false;
	}

	/**
	 * Emit a bytecode opcode and an optional parameter,
	 * returning the index of the last emitted byte
	 */
	public emit(opcode: number, param?: number): number {
		typeof param !== "undefined"
			? this.context.bytecode.push(opcode, param)
			: this.context.bytecode.push(opcode);
		return this.context.bytecode.length - 1;
	}

	public jump(): number {
		return this.emit(OpCode.Jump, 0) - 1;
	}

	public jumpIfFalse(): number {
		return this.emit(OpCode.JumpFalse, 0) - 1;
	}

	public jumpIfTrue(): number {
		return this.emit(OpCode.JumpTrue, 0) - 1;
	}

	public patch(context: Context, jumpOffset: number, destOffset: number): void {
		// This will actually get overwritten by the jump patcher when the linker
		// runs if there is more than one context to compile
		context.bytecode[jumpOffset + 1] = destOffset;
		// Register the jump so that it can get patched later if necessary
		this.jumpPatcher.registerJump(this.context, jumpOffset, destOffset);
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
				: this.createContext(contextName, this.constantPool, this.constants)
		);
	}

	private exitScope(): void {
		this.scopeDepth--;
		this.childScopeIndices.pop();
		this.symbolTable = this.symbolTable.enclosingScope || this.globalScope;
	}

	/**
	 * Creates a new context and adds it to the list of contexts so that
	 * they can be given to the linker later
	 * @param contextName Name of the context (should be the function name)
	 * @param constantPool Shared constant pool
	 * @param constants Shared constants look-up map for avoiding duplicates
	 */
	private createContext(
		contextName: string,
		constantPool: RuntimeValue[],
		constants: Map<any, number>
	): Context {
		const context = new Context(contextName, constantPool, constants);
		this.allContexts.push(context);
		this.jumpPatcher.prepare(this.context);
		return context;
	}
}
