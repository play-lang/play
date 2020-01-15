import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { Describable } from "src/language/token";
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

export class PrintVisitor implements Visitor, Describable {
	private indent: number = 0;
	private desc: string = "";

	constructor(public readonly ast: AbstractSyntaxTree) {}

	public print(): string {
		this.desc = "";
		this.ast.root.accept(this);
		return this.desc;
	}

	public visitProgramNode(node: ProgramNode): void {
		this.desc += "Program\n";
		this.indent += 1;
		for (const statement of node.statements) {
			const last =
				statement === node.statements[node.statements.length - 1];
			this.desc += this.spaces + (last ? "└── " : "├── ");
			statement.accept(this);
		}
		this.indent -= 1;
	}

	public visitIfStatementNode(node: IfStatementNode): void {
		this.desc += "If\n";
		this.indent += 1;
		this.desc += this.spaces + "├── Predicate\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.predicate.accept(this);
		this.indent -= 1;
		this.desc += this.spaces + "├── Then\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.consequent.accept(this);
		this.indent -= 1;
		for (const alternate of node.alternates) {
			const last =
				alternate === node.alternates[node.alternates.length - 1];
			this.desc += this.spaces + (last ? "└── " : "├── ");
			alternate.accept(this);
		}
		this.indent -= 1;
	}

	public visitElseStatementNode(node: ElseStatementNode): void {
		this.desc += "Else";
		this.indent += 1;
		if (node.expr) {
			this.desc += " If\n";
			this.desc += this.spaces + "└── Predicate\n";
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

	public visitBlockStatementNode(node: BlockStatementNode): void {
		this.desc += "Block\n";
		this.indent += 1;
		for (const statement of node.statements) {
			const last =
				statement === node.statements[node.statements.length - 1];
			this.desc += this.spaces + (last ? "└── " : "├── ");
			statement.accept(this);
		}
		this.indent -= 1;
	}

	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		this.desc +=
			node.constructor.name +
			"(`" +
			node.variableName +
			"`, " +
			(node.typeAnnotation.join(" ") || "synth") +
			")\n";
		this.indent += 1;
		if (node.expr) {
			this.desc += this.spaces + "└── ";
			node.expr.accept(this);
		}
		this.indent -= 1;
	}

	public visitIdExpressionNode(node: IdExpressionNode): void {
		this.desc +=
			"IdExpression(" +
			node.name +
			", usedAsFunction=" +
			node.usedAsFunction +
			")\n";
	}

	public visitFunctionDeclarationNode(node: FunctionDeclarationNode): void {
		let params = "";
		let i = 0;
		for (const [
			param,
			typeAnnotation,
		] of node.info.parameterTypes.entries()) {
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

	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		this.desc += "Call(" + node.functionName + ")\n";
		this.indent += 1;
		for (const arg of node.args) {
			const last = arg === node.args[node.args.length - 1];
			this.desc += this.spaces + (last ? "└── " : "├── ");
			arg.accept(this);
		}
		this.indent -= 1;
	}

	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {
		this.desc += "Prefix(" + TokenType[node.operatorType] + ")\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.rhs.accept(this);
		this.indent -= 1;
	}

	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {
		this.desc += "Postfix(" + TokenType[node.operatorType] + ")\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.lhs.accept(this);
		this.indent -= 1;
	}

	public visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void {
		this.desc += "Literal(`" + node.primitiveValue + "`)\n";
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

	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {
		this.desc += "TernaryConditional\n";
		this.indent += 1;
		this.desc += this.spaces + "├── Predicate: ";
		node.predicate.accept(this);
		this.desc += this.spaces + "├── Consequent: ";
		node.consequent.accept(this);
		this.desc += this.spaces + "└── Alternate: ";
		node.alternate.accept(this);
		this.indent -= 1;
	}

	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {
		this.desc += "Assignment(" + TokenType[node.assignmentType] + ")\n";
		this.indent += 1;
		this.desc += this.spaces + "├── lhs: ";
		node.lhs.accept(this);
		this.desc += this.spaces + "└── rhs: ";
		node.rhs.accept(this);
		this.indent -= 1;
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

	public visitExpressionStatementNode(node: ExpressionStatementNode): void {
		this.desc += "ExpressionStatement\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.expr.accept(this);
		this.indent -= 1;
	}

	// MARK: Utility Methods

	private get spaces(): string {
		return "  ".repeat(this.indent * 3);
	}

	public get description(): string {
		return this.print();
	}
}
