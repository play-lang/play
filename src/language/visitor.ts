import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "../parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { ExpressionStatementNode } from "../parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "../parser/nodes/function-declaration-node";
import { IdExpressionNode } from "../parser/nodes/id-expression-node";
import { InvocationExpressionNode } from "../parser/nodes/invocation-expression-node";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "../parser/nodes/primitive-expression-node";
import { ProgramNode } from "../parser/nodes/program-node";
import { ReturnStatementNode } from "../parser/nodes/return-statement-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";

export interface Visitor {
	visitProgramNode(node: ProgramNode): void;
	visitBlockStatementNode(node: BlockStatementNode): void;
	visitVariableDeclarationNode(node: VariableDeclarationNode): void;
	visitIdExpressionNode(node: IdExpressionNode): void;
	visitFunctionDeclarationNode(node: FunctionDeclarationNode): void;
	visitPrefixExpressionNode(node: PrefixExpressionNode): void;
	visitBinaryExpressionNode(node: BinaryExpressionNode): void;
	visitBinaryLogicalExpressionNode(node: BinaryLogicalExpressionNode): void;
	visitPostfixExpressionNode(node: PostfixExpressionNode): void;
	visitInvocationExpressionNode(node: InvocationExpressionNode): void;
	visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void;
	visitTernaryConditionalNode(node: TernaryConditionalNode): void;
	visitAssignmentExpressionNode(node: AssignmentExpressionNode): void;
	visitReturnStatementNode(node: ReturnStatementNode): void;
	visitExpressionStatementNode(node: ExpressionStatementNode): void;
}
