import { Context } from "../language/context";
import { OpCode } from "../language/op-code";
import SymbolTable from "../language/symbol-table";
import { TokenType } from "../language/token-type";
import { Visitor } from "../language/visitor";
import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "../parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { LiteralExpressionNode } from "../parser/nodes/literal-expression-node";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { ProgramNode } from "../parser/nodes/program-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";
import { RuntimeType } from "../vm/runtime-type";
import { RuntimeValue } from "../vm/runtime-value";

export class Compiler extends Visitor {
	/** Current bytecode context */
	public get context(): Context {
		return this._contexts[this._contexts.length - 1];
	}
	/** Ast to compile */
	public readonly ast: ProgramNode;

	/** Constant pool preceding the code */
	public readonly constantPool: RuntimeValue[] = [];
	/**
	 * Maps constant values to their index in the constant pool to prevent duplicate entries
	 */
	public readonly constants: Map<any, number> = new Map();
	/** Current bytecode context */
	private _contexts: Context[] = [];
	/** Global scope */
	private globalScope: SymbolTable;
	/** Symbol table for the current scope */
	private symbolTable: SymbolTable;
	/** Index of the next child scope to visit for each scope level */
	private childScopeIndices: number[] = [0];
	/** Number of scopes deep we are--used as an index to childScopeIndices */
	private scopeDepth: number = 0;

	constructor(ast: ProgramNode, symbolTable: SymbolTable) {
		super();
		this.ast = ast;
		this.symbolTable = symbolTable;
		this.globalScope = symbolTable;
		this._contexts.push(new Context("main", this.constantPool, this.constants));
	}

	// MARK: Visitor

	public visitProgramNode(node: ProgramNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
	}
	public visitBlockStatementNode(node: BlockStatementNode): void {
		this.enterScope();
		for (const statement of node.statements) {
			statement.accept(this);
		}
		this.exitScope();
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
		switch (node.type) {
			case TokenType.String:
				value = node.token.lexeme;
				type = RuntimeType.String;
				break;
			case TokenType.Boolean:
				value = node.token.lexeme === "true" ? true : false;
				value ? this.emit(OpCode.True) : this.emit(OpCode.False);
				return;
			case TokenType.Number:
				value = Number.parseFloat(node.token.lexeme);
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

	// MARK: Compiler Methods

	public compile(): void {
		this.ast.accept(this);
		this.emit(OpCode.Return);
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
		context.bytecode[jumpOffset + 1] = destOffset;
	}

	/** Enter the next child scope of the current symbol table */
	private enterScope(): void {
		const childScopeIndex = this.childScopeIndices[this.scopeDepth]++;
		this.scopeDepth++;
		this.childScopeIndices.push(0);
		this.symbolTable = this.symbolTable.scopes[childScopeIndex];
		this.symbolTable.available = 0;
	}

	private exitScope(): void {
		this.scopeDepth--;
		this.childScopeIndices.pop();
		this.symbolTable = this.symbolTable.enclosingScope || this.globalScope;
	}
}
