import { Visitor } from "../language/visitor";
import { ActionDeclarationNode } from "../parser/nodes/action-declaration-node";
import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "../parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { InvocationExpressionNode } from "../parser/nodes/invocation-operator-parselet";
import { LiteralExpressionNode } from "../parser/nodes/literal-expression-node";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { ProgramNode } from "../parser/nodes/program-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";

export class TypeChecker extends Visitor {
	public visitProgramNode(node: ProgramNode): void {}
	public visitBlockStatementNode(node: BlockStatementNode): void {}
	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {}
	public visitActionDeclarationNode(node: ActionDeclarationNode): void {}
	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {}
	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {}
	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {}
	public visitLiteralExpressionNode(node: LiteralExpressionNode): void {}
	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {}
	public visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void {}
	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {}
	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {}
}
