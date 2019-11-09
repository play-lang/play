import { ProgramNode } from "../parser/nodes/program-node";
import { DeclarationNode } from "../parser/nodes/declaration-node";
import { ValueNode } from "../parser/nodes/value-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { LiteralExpressionNode } from "../parser/nodes/literal-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";

export abstract class Visitor {
	public abstract visitProgramNode(node: ProgramNode): void;
	public abstract visitDeclarationNode(node: DeclarationNode): void;
	public abstract visitValueNode(node: ValueNode): void;
	public abstract visitPrefixExpressionNode(node: PrefixExpressionNode): void;
	public abstract visitLiteralExpressionNode(node: LiteralExpressionNode): void;
	public abstract visitBinaryExpressionNode(node: BinaryExpressionNode): void;
}
