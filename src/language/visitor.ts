import { ProgramNode } from "../parser/nodes/program-node";
import { DeclarationNode } from "../parser/nodes/declaration-node";
import { ValueNode } from "../parser/nodes/value-node";

export abstract class Visitor {
	public abstract visitProgramNode(node: ProgramNode): void;
	public abstract visitDeclarationNode(node: DeclarationNode): void;
	public abstract visitValueNode(node: ValueNode): void;
}
