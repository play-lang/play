import { ProgramNode } from "../nodes/program-node";
import { VariableNode } from "../nodes/variable-node";
import { ValueNode } from "../nodes/value-node";

export abstract class Visitor {
	public abstract visitProgramNode(node: ProgramNode): void;
	public abstract visitVariableNode(node: VariableNode): void;
	public abstract visitValueNode(node: ValueNode): void;
}
