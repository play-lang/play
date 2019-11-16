import { Visitor } from "../language/visitor";
import { ProgramNode } from "../parser/nodes/program-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { LiteralExpressionNode } from "../parser/nodes/literal-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { Context } from "../language/context";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { RuntimeValue, RuntimeType } from "../vm/runtime-value";
import { OpCode } from "../language/op-code";
import { TokenType } from "../language/token-type";
import SymbolTable from "../language/symbol-table";

export class Compiler extends Visitor {
	/** Ast to compile */
	public readonly ast: ProgramNode;
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

	/** Current bytecode context */
	public get context(): Context {
		return this._contexts[this._contexts.length - 1];
	}

	constructor(ast: ProgramNode, symbolTable: SymbolTable) {
		super();
		this.ast = ast;
		this.symbolTable = symbolTable;
		this.globalScope = symbolTable;
		this._contexts.push(new Context());
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
				type = RuntimeType.Boolean;
				break;
			case TokenType.Number:
				value = Number.parseFloat(node.token.lexeme);
				type = RuntimeType.Number;
				break;
			case TokenType.Nil:
				type = RuntimeType.Object;
				value = null;
		}
		// Add the literal to the data section of the current context
		const index = this.context.literal(new RuntimeValue(type, value));
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
			// Binary logical operators
			case TokenType.And:
				this.emit(OpCode.And);
				break;
			case TokenType.Or:
				this.emit(OpCode.Or);
				break;
		}
	}
	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {}
	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {}

	// MARK: Compiler Methods

	public compile(): void {
		this.ast.accept(this);
		this.emit(OpCode.Return);
	}

	/** Emit a bytecode opcode and an optional parameter */
	public emit(opcode: number, param?: number): void {
		typeof param !== "undefined"
			? this.context.bytecode.push(opcode, param)
			: this.context.bytecode.push(opcode);
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
