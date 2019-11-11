import { Visitor } from "../language/visitor";
import { ProgramNode } from "../parser/nodes/program-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";
import { LiteralNode } from "../parser/nodes/value-node";
import { Describable } from "../language/token";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { LiteralExpressionNode } from "../parser/nodes/literal-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { TokenType } from "../language/token-type";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";

export class PrintVisitor extends Visitor implements Describable {
	private indent: number = 0;
	private desc: string = "";

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
		this.desc += this.spaces + "└── ";
		node.expr.accept(this);
		this.indent -= 1;
	}

	public visitLiteralNode(node: LiteralNode): void {
		this.desc +=
			node.constructor.name +
			"(`" +
			node.value +
			"`, " +
			node.typeAnnotation.join(" ") +
			")\n";
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
		this.desc += "Literal(`" + node.token.lexeme + "`)\n";
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

	private get spaces(): string {
		return "  ".repeat(this.indent * 3);
	}

	public get description(): string {
		return this.desc;
	}
}
