import { ProgramNode } from "../parser/nodes/program-node";
import { VariableNode } from "../parser/nodes/variable-node";
import { ValueNode } from "../parser/nodes/value-node";

export abstract class Visitor {
	public abstract visitProgramNode(node: ProgramNode): void;
	public abstract visitVariableNode(node: VariableNode): void;
	public abstract visitValueNode(node: ValueNode): void;
}
