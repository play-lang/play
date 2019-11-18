import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "../parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { LiteralExpressionNode } from "../parser/nodes/literal-expression-node";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { ProgramNode } from "../parser/nodes/program-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";

export abstract class Visitor {
	public abstract visitProgramNode(node: ProgramNode): void;
	public abstract visitBlockStatementNode(node: BlockStatementNode): void;
	public abstract visitVariableDeclarationNode(
		node: VariableDeclarationNode
	): void;
	public abstract visitPrefixExpressionNode(node: PrefixExpressionNode): void;
	public abstract visitBinaryExpressionNode(node: BinaryExpressionNode): void;
	public abstract visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void;
	public abstract visitPostfixExpressionNode(node: PostfixExpressionNode): void;
	public abstract visitLiteralExpressionNode(node: LiteralExpressionNode): void;
	public abstract visitTernaryConditionalNode(
		node: TernaryConditionalNode
	): void;
	public abstract visitAssignmentExpressionNode(
		node: AssignmentExpressionNode
	): void;
}
