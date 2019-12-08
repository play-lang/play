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
import { TokenLike } from "../language/token";
import { TokenType } from "../language/token-type";
import { TypeInfo, TypeRuleset } from "../language/type-system";
import { TypeCheckerError } from "./type-checker-error";

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
		const expr = node.expr;
		if (expr) {
			const expectedType = node.typeAnnotation;
			try {
				const encounteredType = expr.computeType(this.ast);
				this.assertType(node.token, expectedType, encounteredType);
			} catch (e) {
				this.errors.push(e);
			}
		}
	}
	public visitVariableReferenceNode(node: VariableReferenceNode): void {}
	public visitActionDeclarationNode(node: ActionDeclarationNode): void {}
	public visitActionReferenceNode(node: ActionReferenceNode): void {}
	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {
		let expectedType: string[] = [];
		if (!node.rhs.isAddressable) {
			throw new SemanticError(node.);
		}
		switch (node.operatorType) {
			case TokenType.Bang:
				expectedType = ["bool"];
				break;
			case TokenType.Plus:
			case TokenType.Minus:
				expectedType = ["num"];
				break;
			case TokenType.PlusPlus:
			case TokenType.MinusMinus:
		}
		node.operatorType;
		[
			TokenType.Bang,
			TokenType.Plus,
			TokenType.Minus,
			TokenType.PlusPlus,
			TokenType.MinusMinus,
		];
	}
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
	public assertType(
		token: TokenLike,
		ruleset: TypeRuleset,
		type: TypeInfo,
	): boolean {
		if (type.satisfies(ruleset)) return true;
		const prettyExpectedType = this.prettyRuleset(ruleset);
		const prettyEncounteredType = this.prettyType(type);

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
		const hint = `${prefix} Expected ${token.lexeme} to have type ${prettyExpectedType} instead of ${prettyEncounteredType}`;
		const error = new TypeCheckerError(
			token,
			ruleset,
			type,
			hint
		);
		this.errors.push(error);
		return false;
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

	// MARK: Type Checker

	/**
	 * Compares two type annotations (string arrays) to see if they are equal
	 * Worst case runtime is O(N) unless the two arrays have separate lengths
	 * @param type1 The first type annotation
	 * @param type2 The second type annotation
	 */
	private compareTypes(type1: string[], type2: string[]): boolean {
		if (type1.length !== type2.length) return false;
		for (let i = 0; i < type1.length; i++) {
			if (type1[i] !== type2[i]) {
				return false;
			}
		}
		return true;
	}

	/** Make a pretty string from the specified type */
	private prettyType(type: TypeInfo): string {
		if (type.typeAnnotation.length < 1) {
			return "void";
		}
		return type.typeAnnotation.join(" ");
	}

	private prettyRuleset(ruleset: TypeRuleset): string {
		return ruleset.rules.map(typeRule => {
			return "`" + typeRule.typeAnnotation.join(" ") + "`";
		}).join(", ");
	}
}
