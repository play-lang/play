import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "../parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { ExpressionStatementNode } from "../parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "../parser/nodes/function-declaration-node";
import { FunctionReferenceNode } from "../parser/nodes/function-reference-node";
import { InvocationExpressionNode } from "../parser/nodes/invocation-operator-parselet";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "../parser/nodes/primitive-expression-node";
import { ProgramNode } from "../parser/nodes/program-node";
import { ReturnStatementNode } from "../parser/nodes/return-statement-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";
import { VariableReferenceNode } from "../parser/nodes/variable-reference-node";

export abstract class Visitor {
	public abstract visitProgramNode(node: ProgramNode): void;
	public abstract visitBlockStatementNode(node: BlockStatementNode): void;
	public abstract visitVariableDeclarationNode(
		node: VariableDeclarationNode
	): void;
	public abstract visitVariableReferenceNode(node: VariableReferenceNode): void;
	public abstract visitActionDeclarationNode(
		node: FunctionDeclarationNode
	): void;
	public abstract visitActionReferenceNode(node: FunctionReferenceNode): void;
	public abstract visitPrefixExpressionNode(node: PrefixExpressionNode): void;
	public abstract visitBinaryExpressionNode(node: BinaryExpressionNode): void;
	public abstract visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void;
	public abstract visitPostfixExpressionNode(node: PostfixExpressionNode): void;
	public abstract visitInvocationExpressionNode(
		node: InvocationExpressionNode
	): void;
	public abstract visitPrimitiveExpressionNode(
		node: PrimitiveExpressionNode
	): void;
	public abstract visitTernaryConditionalNode(
		node: TernaryConditionalNode
	): void;
	public abstract visitAssignmentExpressionNode(
		node: AssignmentExpressionNode
	): void;
	public abstract visitReturnStatementNode(node: ReturnStatementNode): void;
	public abstract visitExpressionStatementNode(
		node: ExpressionStatementNode
	): void;
}
