import { Describable } from "src/common/describable";
import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
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

export class PrintVisitor implements Visitor, Describable {
	private desc: string = "";
	private indent: number = 0;

	constructor(public readonly ast: AbstractSyntaxTree) {}

	public get description(): string {
		return this.print();
	}

	// MARK: Utility Methods

	private get spaces(): string {
		return "  ".repeat(this.indent * 3);
	}

	public print(): string {
		this.desc = "";
		this.ast.root.accept(this);
		return this.desc;
	}

	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {
		this.desc += "Assignment(" + TokenType[node.assignmentType] + ")\n";
		this.indent += 1;
		this.desc += this.spaces + "├── lhs ";
		node.lhs.accept(this);
		this.desc += this.spaces + "└── rhs ";
		node.rhs.accept(this);
		this.indent -= 1;
	}

	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {
		this.desc += "Binary(" + TokenType[node.operatorType] + ")\n";
		this.indent += 1;
		this.desc += this.spaces + "├── ";
		node.lhs.accept(this);
		this.desc += this.spaces + "└── ";
		node.rhs.accept(this);
		this.indent -= 1;
	}

	public visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void {
		this.desc += "BinaryLogical(" + TokenType[node.operatorType] + ")\n";
		this.indent += 1;
		this.desc += this.spaces + "├── ";
		node.lhs.accept(this);
		this.desc += this.spaces + "└── ";
		node.rhs.accept(this);
		this.indent -= 1;
	}

	public visitBlockStatementNode(node: BlockStatementNode): void {
		this.desc += "Block\n";
		this.indent += 1;
		for (const statement of node.statements) {
			const last = statement === node.statements[node.statements.length - 1];
			this.desc += this.spaces + (last ? "└── " : "├── ");
			statement.accept(this);
		}
		this.indent -= 1;
	}

	public visitDoWhileStatementNode(node: DoWhileStatementNode): void {
		this.desc += "DoWhileStatement\n";
		this.indent += 1;
		this.desc += this.spaces + "└── do ";
		node.block.accept(this);
		this.desc += this.spaces + "├── while ";
		node.condition.accept(this);
		this.indent -= 1;
	}

	public visitElseStatementNode(node: ElseStatementNode): void {
		this.desc += "Else";
		this.indent += 1;
		if (node.expr) {
			this.desc += " If\n";
			this.desc += this.spaces + "└── predicate\n";
			this.indent += 1;
			this.desc += this.spaces + "└── ";
			node.expr?.accept(this);
			this.indent -= 1;
		} else {
			this.desc += "\n";
		}
		this.desc += this.spaces + "└── ";
		node.block.accept(this);
		this.indent -= 1;
	}

	public visitExpressionStatementNode(node: ExpressionStatementNode): void {
		this.desc += "ExpressionStatement\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.expr.accept(this);
		this.indent -= 1;
	}

	public visitFunctionDeclarationNode(node: FunctionDeclarationNode): void {
		let params = "";
		let i = 0;
		for (const [param, typeAnnotation] of node.info.parameterTypes.entries()) {
			const type = typeAnnotation.join(" ");
			params += type + " " + param;
			if (i < node.info.parameterTypes.size - 1) params += ", ";
			i++;
		}
		this.desc +=
			"Function " +
			node.info.typeAnnotation.join(" ") +
			" " +
			node.info.name +
			"(" +
			params +
			")\n";
		this.indent += 1;
		if (node.block) {
			this.desc += this.spaces + "└── ";
			node.block.accept(this);
		}
		this.indent -= 1;
	}

	public visitIdExpressionNode(node: IdExpressionNode): void {
		this.desc +=
			"IdExpression(" +
			node.name +
			", use=" +
			IdExpressionUse[node.use] +
			")\n";
	}

	public visitIfStatementNode(node: IfStatementNode): void {
		this.desc += "If\n";
		this.indent += 1;
		this.desc += this.spaces + "├── predicate\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.predicate.accept(this);
		this.indent -= 1;
		this.desc += this.spaces + "├── then\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.consequent.accept(this);
		this.indent -= 1;
		for (const alternate of node.alternates) {
			const last = alternate === node.alternates[node.alternates.length - 1];
			this.desc += this.spaces + (last ? "└── " : "├── ");
			alternate.accept(this);
		}
		this.indent -= 1;
	}

	public visitIndexExpressionNode(node: IndexExpressionNode): void {
		this.desc += "Index\n";
		this.indent += 1;

		this.desc += this.spaces + "├── lhs\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.lhs.accept(this);
		this.indent -= 1;

		this.desc += this.spaces + "└── index\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.index.accept(this);
		this.indent -= 1;

		this.indent -= 1;
	}

	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		this.desc +=
			"Call(" +
			node.functionName +
			", tailRecursive=" +
			String(node.isTailRecursive) +
			")\n";
		this.indent += 1;
		for (const arg of node.args) {
			const last = arg === node.args[node.args.length - 1];
			this.desc += this.spaces + (last ? "└── " : "├── ");
			arg.accept(this);
		}
		this.indent -= 1;
	}

	public visitListNode(node: ListNode): void {
		this.desc += "List\n";
		this.indent += 1;
		for (const member of node.members) {
			const last = member === node.members[node.members.length - 1];
			this.desc += this.spaces + (last ? "└── " : "├── ");
			member.accept(this);
		}
		this.indent -= 1;
	}

	public visitMapNode(node: MapNode): void {
		this.desc += "Map\n";
		this.indent += 1;
		for (let i = 0; i < node.keys.length; i++) {
			const key = node.keys[i];
			const value = node.values[i];
			this.desc += this.spaces + "├── key\n";
			this.indent += 1;
			this.desc += this.spaces + "└── ";
			key.accept(this);
			this.indent -= 1;
			this.desc += this.spaces + "└── value\n";
			this.indent += 1;
			this.desc += this.spaces + "└── ";
			value.accept(this);
			this.indent -= 1;
		}
		this.indent -= 1;
	}

	public visitMemberAccessExpressionNode(
		node: MemberAccessExpressionNode
	): void {
		this.desc += "Member Access\n";
		this.indent += 1;

		this.desc += this.spaces + "├── lhs\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.lhs.accept(this);
		this.indent -= 1;

		this.desc += this.spaces + "└── member\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.member.accept(this);
		this.indent -= 1;

		this.indent -= 1;
	}

	public visitModelNode(node: ModelNode): void {
		this.desc += "Model\n";
		this.indent += 1;
		node.propertyDeclarations.forEach((decl, index) => {
			this.desc +=
				this.spaces +
				(index === node.propertyDeclarations.length - 1 ? "└── " : "├── ");
			decl.accept(this);
		});
		this.indent -= 1;
	}

	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {
		this.desc += "Postfix(" + TokenType[node.operatorType] + ")\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.lhs.accept(this);
		this.indent -= 1;
	}

	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {
		this.desc += "Prefix(" + TokenType[node.operatorType] + ")\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.rhs.accept(this);
		this.indent -= 1;
	}

	public visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void {
		this.desc += "Literal(`" + node.primitiveValue + "`)\n";
	}

	public visitProgramNode(node: ProgramNode): void {
		this.desc += "Program\n";
		this.indent += 1;
		for (const statement of node.statements) {
			const last = statement === node.statements[node.statements.length - 1];
			this.desc += this.spaces + (last ? "└── " : "├── ");
			statement.accept(this);
		}
		this.indent -= 1;
	}

	public visitProtocolNode(node: ProtocolNode): void {
		this.desc += "Protocol\n";
		// TODO: Finish protocol declaration print implementation
	}

	public visitReturnStatementNode(node: ReturnStatementNode): void {
		this.desc += "Return\n";
		if (node.expr) {
			this.indent += 1;
			this.desc += this.spaces + "└── ";
			node.expr.accept(this);
			this.indent -= 1;
		}
	}

	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {
		this.desc += "TernaryConditional\n";
		this.indent += 1;
		this.desc += this.spaces + "├── predicate ";
		node.predicate.accept(this);
		this.desc += this.spaces + "├── consequent ";
		node.consequent.accept(this);
		this.desc += this.spaces + "└── alternate ";
		node.alternate.accept(this);
		this.indent -= 1;
	}

	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		this.desc +=
			node.constructor.name +
			"(`" +
			node.variableName +
			"`, " +
			(node.typeAnnotation.join(" ") || "inferred") +
			")\n";
		this.indent += 1;
		if (node.expr) {
			this.desc += this.spaces + "└── ";
			node.expr.accept(this);
		}
		this.indent -= 1;
	}

	public visitWhileStatementNode(node: WhileStatementNode): void {
		this.desc += "WhileStatement\n";
		this.indent += 1;
		this.desc += this.spaces + "├── while ";
		node.condition.accept(this);
		this.desc += this.spaces + "└── do ";
		node.block.accept(this);
		this.indent -= 1;
	}
}
