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

export class Compiler extends Visitor {
	/** Ast to compile */
	public readonly ast: ProgramNode;
	/** Current bytecode context */
	private _contexts: Context[] = [];

	public get context(): Context {
		return this._contexts[this._contexts.length - 1];
	}

	constructor(ast: ProgramNode) {
		super();
		this.ast = ast;
		this._contexts.push(new Context());
	}

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

	// MARK: Visitor

	public visitProgramNode(node: ProgramNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
	}
	public visitBlockStatementNode(node: BlockStatementNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
	}
	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		if (!node.expr) {
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
		this.emit(OpCode.Data, index);
	}
	// Compile a binary operator expression
	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {
		node.lhs.accept(this);
		node.rhs.accept(this);
		switch (node.operatorType) {
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
}
