import { Visitor } from "../language/visitor";
import { ActionDeclarationNode } from "../parser/nodes/action-declaration-node";
import { ActionReferenceNode } from "../parser/nodes/action-reference-node";
import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "../parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { ExpressionStatementNode } from "../parser/nodes/expression-statement-node";
import { InvocationExpressionNode } from "../parser/nodes/invocation-operator-parselet";
import { PostfixExpressionNode } from "../parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "../parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "../parser/nodes/primitive-expression-node";
import { ProgramNode } from "../parser/nodes/program-node";
import { ReturnStatementNode } from "../parser/nodes/return-statement-node";
import { TernaryConditionalNode } from "../parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "../parser/nodes/variable-declaration-node";
import { VariableReferenceNode } from "../parser/nodes/variable-reference-node";

import { AbstractSyntaxTree } from "../language/abstract-syntax-tree";
import { SemanticError } from "../language/semantic-error";

export class TypeChecker extends Visitor {
	/* Type checker errors encountered while checking types */
	public errors: SemanticError[] = [];

	constructor(
		/** Abstract syntax tree to validate */
		public readonly ast: AbstractSyntaxTree
	) {
		super();
	}

	public check(): boolean {
		this.errors = [];
		this.ast.root.accept(this);
		return this.errors.length < 1;
	}

	// MARK: Visitor
	public visitProgramNode(node: ProgramNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
	}
	public visitBlockStatementNode(node: BlockStatementNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
	}
	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {}
	public visitVariableReferenceNode(node: VariableReferenceNode): void {}
	public visitActionDeclarationNode(node: ActionDeclarationNode): void {}
	public visitActionReferenceNode(node: ActionReferenceNode): void {}
	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {}
	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {}
	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {}
	public visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void {}
	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {}
	public visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void {}
	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {}
	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {}
	public visitReturnStatementNode(node: ReturnStatementNode): void {}
	public visitExpressionStatementNode(node: ExpressionStatementNode): void {}

	/**
	 * Registers an error if the expected type is not equal to the encountered
	 * type, otherwise does nothing
	 * @param token The token where the type is expected
	 * @param expectedType The expected type
	 * @param encounteredType The encountered type
	 * @returns True if the expected type is the encountered type, false if a type
	 * error was found
	 */
	// public assertType(
	// 	token: TokenLike,
	// 	ruleset: TypeRuleset,
	// 	type: TypeInfo
	// ): boolean {
	// 	if (type.satisfies(ruleset)) return true;
	// 	const prettyExpectedType = ruleset.description;
	// 	const prettyEncounteredType = type.description;

	// 	const prefix =
	// 		"Type error in " +
	// 		token.file.name +
	// 		" at " +
	// 		token.line +
	// 		":" +
	// 		token.column +
	// 		" (" +
	// 		token.pos +
	// 		"): ";
	// 	const hint = `${prefix} Expected ${token.lexeme} to have type ${prettyExpectedType} instead of ${prettyEncounteredType}`;
	// 	const error = new TypeCheckerError(token, ruleset, type, hint);
	// 	this.errors.push(error);
	// 	return false;
	// }

	/**
	 * Report a semantic error to the type checker
	 *
	 * AST Nodes may call this when the TypeChecker calls `check` on them to
	 * report semantic errors other than type errors
	 * @param error The error to report
	 */
	public report(error: SemanticError): void {
		this.errors.push(error);
	}

	// MARK: Type Checker
}
