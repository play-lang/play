import { Visitor } from "../language/visitor";
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

import { AbstractSyntaxTree } from "../language/abstract-syntax-tree";
import { SemanticError } from "../language/semantic-error";
import { TokenLike } from "../language/token";
import { Type } from "../language/types/type-system";
import { TypeCheckError } from "./type-check-error";

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
	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		if (node.expr) node.expr!.accept(this);
		node.validate(this);
	}
	public visitVariableReferenceNode(node: VariableReferenceNode): void {
		node.validate();
	}
	public visitFunctionDeclarationNode(node: FunctionDeclarationNode): void {
		node.validate(this);
	}
	public visitFunctionReferenceNode(node: FunctionReferenceNode): void {
		node.validate(this);
	}
	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {
		node.rhs.accept(this);
		node.validate(this);
	}
	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {
		node.lhs.accept(this);
		node.validate(this);
	}
	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		node.validate(this);
	}
	public visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void {
		node.validate();
	}
	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {
		node.validate(this);
	}
	public visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void {
		node.validate(this);
	}
	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {
		node.predicate.accept(this);
		node.consequent.accept(this);
		node.alternate.accept(this);
		node.validate(this);
	}
	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {
		node.validate(this);
	}
	public visitReturnStatementNode(node: ReturnStatementNode): void {
		if (node.expr) node.expr!.accept(this);
		node.validate();
	}
	public visitExpressionStatementNode(node: ExpressionStatementNode): void {
		node.validate(this);
	}

	public mismatch(
		token: TokenLike,
		expectedType: Type,
		encounteredType: Type
	): void {
		const prettyExpectedType = expectedType.description;
		const prettyEncounteredType = encounteredType.description;
		const prefix = this.errorPrefix(token);
		const hint = `${prefix} Expected ${token.lexeme} to have type ${prettyExpectedType} instead of ${prettyEncounteredType}`;
		const error = new TypeCheckError(token, hint);
		this.errors.push(error);
	}

	public badAssignment(token: TokenLike, expectedType: Type): void {
		const pretty = expectedType.description;
		const prefix = this.errorPrefix(token);
		const hint = `${prefix} Invalid assignment—expected a variable reference to ${pretty}`;
		const error = new SemanticError(token, hint);
		this.errors.push(error);
	}

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

	/**
	 * Describes a type error prefix string based on an error token
	 * @param token The token where the error occurred
	 */
	public errorPrefix(token: TokenLike): string {
		const prefix =
			"Type error in " +
			token.file.name +
			" at " +
			token.line +
			":" +
			token.column +
			" (" +
			token.pos +
			"): ";
		return prefix;
	}

	// MARK: Type Checker
}
