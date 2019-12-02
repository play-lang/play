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

export class PrintVisitor extends Visitor implements Describable {
	private indent: number = 0;
	private desc: string = "";

	constructor(public readonly ast: AbstractSyntaxTree) {
		super();
	}

	public print(): string {
		this.desc = "";
		this.ast.root.accept(this);
		return this.desc;
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

	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		this.desc +=
			node.constructor.name +
			"(`" +
			node.name +
			"`, " +
			node.typeAnnotation.join(" ") +
			")\n";
		this.indent += 1;
		if (node.expr) {
			this.desc += this.spaces + "└── ";
			node.expr.accept(this);
		}
		this.indent -= 1;
	}

	public visitVariableReferenceNode(node: VariableReferenceNode): void {
		this.desc += "VariableReference(" + node.variableName + ")\n";
	}

	public visitActionDeclarationNode(node: ActionDeclarationNode): void {
		let params = "";
		let i = 0;
		for (const [param, typeAnnotation] of node.info.parameterTypes.entries()) {
			const type = typeAnnotation.join(" ");
			params += type + " " + param;
			if (i < node.info.parameterTypes.size - 1) params += ", ";
			i++;
		}
		this.desc +=
			"Action " +
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

	public visitActionReferenceNode(node: ActionReferenceNode): void {
		this.desc += "ActionReference(" + node.actionName + ")\n";
	}

	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		this.desc += "Call(" + node.actionName + ")\n";
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

	public visitLiteralExpressionNode(node: LiteralExpressionNode): void {
		this.desc += "Literal(`" + node.literalValue + "`)\n";
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
	}

	public visitReturnValueStatementNode(node: ReturnValueStatementNode): void {
		this.desc += "ReturnValue\n";
		this.indent += 1;
		this.desc += this.spaces + "└── ";
		node.expr.accept(this);
		this.indent -= 1;
	}

	private get spaces(): string {
		return "  ".repeat(this.indent * 3);
	}

	public get description(): string {
		return this.print();
	}
}
