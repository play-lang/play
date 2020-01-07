import { AssignmentExpressionNode } from "src/parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "src/parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "src/parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";
import { ExpressionStatementNode } from "src/parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "src/parser/nodes/function-declaration-node";
import { IdExpressionNode } from "src/parser/nodes/id-expression-node";
import { InvocationExpressionNode } from "src/parser/nodes/invocation-expression-node";
import { PostfixExpressionNode } from "src/parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "src/parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "src/parser/nodes/primitive-expression-node";
import { ProgramNode } from "src/parser/nodes/program-node";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";
import { TernaryConditionalNode } from "src/parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";

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
