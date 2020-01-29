import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { Node } from "src/language/node";
import { Describable } from "src/language/token";
import { TokenType } from "src/language/token-type";
import { Visitor } from "src/language/visitor";
import { AssignmentExpressionNode } from "src/parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "src/parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "src/parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";
import { DoWhileStatementNode } from "src/parser/nodes/do-while-statement-node";
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
import {
	RepresentedCollectionType,
	SetOrListNode,
} from "src/parser/nodes/set-or-list-node";
import { TernaryConditionalNode } from "src/parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";
import { WhileStatementNode } from "src/parser/nodes/while-statement-node";

export class JSONVisitor implements Visitor, Describable {
	// MARK: Describable

	public get description(): string {
		return JSON.stringify(this.json());
	}

	// MARK: Properties

	private stack: object[] = [];

	constructor(public readonly ast: AbstractSyntaxTree) {}

	// MARK: Methods

	public json(): object {
		this.stack = [];
		this.ast.root.accept(this);
		const program = this.stack.pop();
		return JSON.parse(JSON.stringify(program));
	}

	// MARK: Visitor

	public visitProgramNode(node: ProgramNode): void {
		const statements = [];
		for (const statement of node.statements) {
			statement.accept(this);
			statements.push(this.stack.pop());
		}
		this.stack.push({
			...def(node),
			statements,
		});
	}
	public visitIfStatementNode(node: IfStatementNode): void {
		node.predicate.accept(this);
		const predicate = this.stack.pop();
		node.consequent.accept(this);
		const consequent = this.stack.pop();
		const alternates: any[] = [];
		for (const alternate of node.alternates) {
			alternate.accept(this);
			alternates.push(this.stack.pop());
		}
		this.stack.push({
			...def(node),
			predicate,
			consequent,
			alternates,
		});
	}
	public visitElseStatementNode(node: ElseStatementNode): void {
		let expr: any | undefined;
		if (node.expr) {
			node.expr.accept(this);
			expr = this.stack.pop();
		}
		node.block.accept(this);
		const block = this.stack.pop();
		this.stack.push({
			...def(node),
			expr,
			block,
		});
	}
	public visitBlockStatementNode(node: BlockStatementNode): void {
		const statements = [];
		for (const statement of node.statements) {
			statement.accept(this);
			statements.push(this.stack.pop());
		}
		this.stack.push({
			...def(node),
			isFunctionBlock: node.isFunctionBlock,
			statements,
		});
	}
	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		const obj = {
			...def(node),
			name: node.variableName,
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
	public visitIdExpressionNode(node: IdExpressionNode): void {
		this.stack.push({
			...def(node),
			name: node.name,
			usedAsFunction: node.usedAsFunction,
		});
	}
	public visitFunctionDeclarationNode(node: FunctionDeclarationNode): void {
		node.block!.accept(this);
		const block = this.stack.pop();
		const parameterTypes = Array.from(node.info.parameterTypes.entries());
		this.stack.push({
			...def(node),
			typeAnnotation: node.info.typeAnnotation,
			parameterTypes,
			parameters: [...node.info.parameters],
			block,
		});
	}
	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {
		node.rhs.accept(this);
		const rhs = this.stack.pop();
		this.stack.push({
			...def(node),
			rhs,
		});
	}
	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {
		node.lhs.accept(this);
		node.rhs.accept(this);
		const rhs = this.stack.pop();
		const lhs = this.stack.pop();
		this.stack.push({
			...def(node),
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
			...def(node),
			lhs,
			rhs,
		});
	}
	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {
		node.lhs.accept(this);
		const lhs = this.stack.pop();
		this.stack.push({
			...def(node),
			lhs,
		});
	}
	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		node.lhs.accept(this);
		const lhs = this.stack.pop();
		this.stack.push({
			...def(node),
			functionName: node.functionName,
			isTailRecursive: node.isTailRecursive,
			args: node.args,
			lhs,
		});
	}
	public visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void {
		this.stack.push({
			...def(node),
			literalType: TokenType[node.primitiveType],
			literalValue: node.primitiveValue,
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
			...def(node),
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
			...def(node),
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
				...def(node),
				value: expr,
			});
		} else {
			this.stack.push({
				...def(node),
			});
		}
	}
	public visitSetOrListNode(node: SetOrListNode): void {
		const members = [];
		for (const member of node.members) {
			member.accept(this);
			members.push(this.stack.pop());
		}
		this.stack.push({
			...def(node),
			representedCollectionType:
				RepresentedCollectionType[node.representedCollectionType],
			members,
		});
	}
	public visitExpressionStatementNode(node: ExpressionStatementNode): void {
		node.expr.accept(this);
		const expr = this.stack.pop();
		this.stack.push({
			...def(node),
			expr,
		});
	}
	public visitDoWhileStatementNode(node: DoWhileStatementNode): void {
		node.block.accept(this);
		const block = this.stack.pop();
		node.condition.accept(this);
		const condition = this.stack.pop();
		this.stack.push({
			...def(node),
			condition,
			block,
		});
	}
	public visitWhileStatementNode(node: WhileStatementNode): void {
		node.condition.accept(this);
		const condition = this.stack.pop();
		node.block.accept(this);
		const block = this.stack.pop();
		this.stack.push({
			...def(node),
			condition,
			block,
		});
	}
}

function def(node: Node): object {
	return {
		type: node.nodeName,
		start: node.start,
		end: node.end,
		parent: node.parent?.nodeName,
		isDead: node.isDead,
		isLast: node.isLast,
	};
}
