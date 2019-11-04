import { Visitor } from "../language/visitor";
import { ProgramNode } from "../parser/nodes/program-node";
import { VariableNode } from "../parser/nodes/variable-node";
import { ValueNode } from "../parser/nodes/value-node";
import { Describable } from "../language/token";

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

	public visitVariableNode(node: VariableNode): void {
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

	public visitValueNode(node: ValueNode): void {
		this.desc +=
			node.constructor.name +
			"(`" +
			node.value +
			"`, " +
			node.typeAnnotation.join(" ") +
			")\n";
	}

	private get spaces(): string {
		return " ".repeat(this.indent * 2);
	}

	public get description(): string {
		return this.desc;
	}
}
