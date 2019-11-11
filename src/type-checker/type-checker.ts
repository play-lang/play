import { Visitor } from "../language/visitor";
import { ProgramNode } from "../parser/nodes/program-node";
import { DeclarationNode } from "../parser/nodes/declaration-node";
import { ValueNode } from "../parser/nodes/value-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { LiteralExpressionNode } from "../parser/nodes/literal-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";

export class TypeChecker extends Visitor {
	public visitProgramNode(node: ProgramNode): void {}
	public visitBlockStatementNode(node: BlockStatementNode): void {}
	public visitDeclarationNode(node: DeclarationNode): void {}
	public visitValueNode(node: ValueNode): void {}
	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {}
	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {}
	public visitLiteralExpressionNode(node: LiteralExpressionNode): void {}
	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {}
	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {}
	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {}
}
