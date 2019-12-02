import { AbstractSyntaxTree } from "../language/abstract-syntax-tree";
import { Describable } from "../language/token";
import { TokenType } from "../language/token-type";
import { Visitor } from "../language/visitor";
import { ActionDeclarationNode } from "../parser/nodes/action-declaration-node";
import { ActionReferenceNode } from "../parser/nodes/action-reference-node";
import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "../parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { ExpressionStatementNode } from "../parser/nodes/expression-statement-node";
import { InvocationExpressionNode } from "../parser/nodes/invocation-operator-parselet";
import { LiteralExpressionNode } from "../parser/nodes/literal-expression-node";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { ProgramNode } from "../parser/nodes/program-node";
import { ReturnStatementNode } from "../parser/nodes/return-statement-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";
import { VariableReferenceNode } from "../parser/nodes/variable-reference-node";

export class JSONVisitor extends Visitor implements Describable {
	// MARK: Describable

	public get description(): string {
		return JSON.stringify(this.json());
	}

	// MARK: Properties

	private stack: object[] = [];

	constructor(public readonly ast: AbstractSyntaxTree) {
		super();
	}

	// MARK: Methods

	public json(): object {
		this.stack = [];
		this.ast.root.accept(this);
		const program = this.stack.pop();
		return JSON.parse(JSON.stringify(program));
	}

	// MARK: Visitor

	public visitProgramNode(node: ProgramNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
		const statements = this.clear();
		this.stack.push({
			type: "program",
			start: node.start,
			end: node.end,
			statements,
		});
	}
	public visitBlockStatementNode(node: BlockStatementNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
		const statements = this.clear();
		this.stack.push({
			type: "block",
			start: node.start,
			end: node.end,
			isActionBlock: node.isActionBlock,
			statements,
		});
	}
	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		const obj = {
			type: "var-decl",
			start: node.start,
			end: node.end,
			name: node.name,
			typeAnnotation: node.typeAnnotation,
			isImmutable: node.isImmutable,
		};
		if (node.expr) {
			node.expr.accept(this);
			const expr = this.stack.pop();
			this.stack.push({
				...obj,
				expr,
			});
			return;
		}
		this.stack.push(obj);
	}
	public visitVariableReferenceNode(node: VariableReferenceNode): void {
		this.stack.push({
			type: "variable-ref",
			start: node.start,
			end: node.end,
			variableName: node.variableName,
		});
	}
	public visitActionDeclarationNode(node: ActionDeclarationNode): void {
		node.block!.accept(this);
		const block = this.stack.pop();
		const parameterTypes = Array.from(node.info.parameterTypes.entries());
		this.stack.push({
			type: "action-decl",
			start: node.start,
			end: node.end,
			typeAnnotation: node.info.typeAnnotation,
			parameterTypes,
			parameters: [...node.info.parameters],
			block,
		});
	}
	public visitActionReferenceNode(node: ActionReferenceNode): void {
		this.stack.push({
			type: "action-ref",
			start: node.start,
			end: node.end,
			actionName: node.actionName,
		});
	}
	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {
		node.rhs.accept(this);
		const rhs = this.stack.pop();
		this.stack.push({
			type: "prefix-expr",
			start: node.start,
			end: node.end,
			rhs,
		});
	}
	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {
		node.lhs.accept(this);
		node.rhs.accept(this);
		const rhs = this.stack.pop();
		const lhs = this.stack.pop();
		this.stack.push({
			type: "binary-expr",
			start: node.start,
			end: node.end,
			lhs,
			rhs,
		});
	}
	public visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void {
		node.lhs.accept(this);
		node.rhs.accept(this);
		const rhs = this.stack.pop();
		const lhs = this.stack.pop();
		this.stack.push({
			type: "binary-logical-expr",
			start: node.start,
			end: node.end,
			lhs,
			rhs,
		});
	}
	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {
		node.lhs.accept(this);
		const lhs = this.stack.pop();
		this.stack.push({
			type: "postfix-expr",
			start: node.start,
			end: node.end,
			lhs,
		});
	}
	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		node.lhs.accept(this);
		const lhs = this.stack.pop();
		this.stack.push({
			type: "action-call",
			start: node.start,
			end: node.end,
			actionName: node.actionName,
			args: node.args,
			lhs,
		});
	}
	public visitLiteralExpressionNode(node: LiteralExpressionNode): void {
		this.stack.push({
			type: "literal",
			start: node.start,
			end: node.end,
			literalType: TokenType[node.literalType],
			literalValue: node.literalValue,
		});
	}
	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {
		node.predicate.accept(this);
		node.consequent.accept(this);
		node.alternate.accept(this);
		const alternate = this.stack.pop();
		const consequent = this.stack.pop();
		const predicate = this.stack.pop();
		this.stack.push({
			type: "conditional-expr",
			start: node.start,
			end: node.end,
			predicate,
			consequent,
			alternate,
		});
	}
	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {
		node.lhs.accept(this);
		node.rhs.accept(this);
		const rhs = this.stack.pop();
		const lhs = this.stack.pop();
		this.stack.push({
			type: "assignment",
			start: node.start,
			end: node.end,
			assignmentType: TokenType[node.assignmentType],
			lhs,
			rhs,
		});
	}

	public visitReturnStatementNode(node: ReturnStatementNode): void {
		if (node.expr) {
			node.expr.accept(this);
			const expr = this.stack.pop();
			this.stack.push({
				type: "return-value",
				start: node.start,
				end: node.end,
				value: expr,
			});
		} else {
			this.stack.push({
				type: "return",
				start: node.start,
				end: node.end,
			});
		}
	}

	public visitExpressionStatementNode(node: ExpressionStatementNode): void {
		node.expr.accept(this);
		const expr = this.stack.pop();
		this.stack.push({
			type: "expression-statement",
			start: node.start,
			end: node.end,
			expr,
		});
	}

	// MARK: Private Methods

	/**
	 * Clears the stack and returns a copy of what was in it
	 */
	private clear(): any[] {
		const stack = [...this.stack];
		this.stack = [];
		return stack;
	}
}
