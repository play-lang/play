import { Visitor } from "../language/visitor";
import { AssignmentExpressionNode } from "../parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "../parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "../parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "../parser/nodes/block-statement-node";
import { ExpressionStatementNode } from "../parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "../parser/nodes/function-declaration-node";
import { FunctionReferenceNode } from "../parser/nodes/function-reference-node";
import { InvocationExpressionNode } from "../parser/nodes/invocation-expression-node";
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
import { SymbolTable } from "../language/symbol-table";
import { TokenLike } from "../language/token";
import { TokenType } from "../language/token-type";
import { Environment } from "../language/types/environment";
import {
	constructFunctionType,
	Num,
	Type,
} from "../language/types/type-system";
import { TypeCheckError } from "./type-check-error";

export class TypeChecker implements Visitor {
	/** Current type checking environment */
	public get env(): Environment {
		return {
			symbolTable: this.symbolTable,
			functionTable: this.ast.functionTable,
		};
	}
	/* Type checker errors encountered while checking types */
	public errors: SemanticError[] = [];

	/** Global scope */
	private globalScope: SymbolTable;
	/** Symbol table for the current scope */
	private symbolTable: SymbolTable;

	/** Index of the next child scope to visit for each scope level */
	private childScopeIndices: number[] = [0];
	/** Number of scopes deep we are--used as an index to childScopeIndices */
	private scopeDepth: number = 0;

	constructor(
		/** Abstract syntax tree to validate */
		public readonly ast: AbstractSyntaxTree
	) {
		this.symbolTable = ast.symbolTable;
		this.globalScope = ast.symbolTable;
	}

	// MARK: Methods

	public check(): boolean {
		// Reset everything
		this.errors = [];
		this.childScopeIndices = [0];
		this.scopeDepth = 0;

		// Compute function types before checking types
		for (const key of this.ast.functionTable.keys()) {
			const info = this.ast.functionTable.get(key)!;
			if (!info.type) {
				// Compute the type of the function
				info.type = constructFunctionType(info);
			}
		}

		this.ast.root.accept(this);
		return this.errors.length < 1;
	}

	/**
	 * Register a type mismatch error with the type checker
	 * @param token The token where the error occurred
	 * @param expectedType The expected type
	 * @param encounteredType The encountered type
	 */
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

	/**
	 * Register an invalid assignment error with the type checker
	 * @param token The token where the error occurred
	 * @param expectedType The expected type
	 * @param encounteredType The encountered type
	 */
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

	/** Enter the next child scope of the current symbol table */
	public enterScope(): void {
		const childScopeIndex = this.childScopeIndices[this.scopeDepth++]++;
		this.childScopeIndices.push(0);
		this.symbolTable = this.symbolTable.scopes[childScopeIndex];
	}

	/** Exit the current scope */
	public exitScope(): void {
		this.scopeDepth--;
		this.childScopeIndices.pop();
		this.symbolTable = this.symbolTable.enclosingScope || this.globalScope;
	}

	// MARK: Visitor
	public visitProgramNode(node: ProgramNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
	}

	public visitBlockStatementNode(node: BlockStatementNode): void {
		this.enterScope();
		for (const statement of node.statements) {
			statement.accept(this);
		}
		this.exitScope();
	}

	public visitVariableDeclarationNode(node: VariableDeclarationNode): void {
		const scope = this.symbolTable.idInScope(node.variableName);
		if (!scope) {
			this.report(
				new SemanticError(node.token, "Variable not found in symbol table")
			);
			return;
		}
		// Visit the assignment expression that might follow a variable declaration:
		if (node.expr) node.expr!.accept(this);
		// If the node has an assigned value and a type assertion, make sure they
		// are both the same type.
		if (node.expr && node.typeAnnotation) {
			const type = node.type(this.env);
			const exprType = node.expr.type(this.env);
			const idSymbol = scope.lookup(node.variableName)!;
			idSymbol.type = type;
			if (!type.equivalent(exprType)) {
				// Report mismatch between variable's assigned value and variable's
				// expected value
				this.mismatch(node.token, type, exprType);
			}
		}
	}

	public visitVariableReferenceNode(node: VariableReferenceNode): void {
		const scope = this.symbolTable.idInScope(node.variableName);
		if (!scope) {
			this.report(
				new SemanticError(
					node.token,
					"Variable " + node.variableName + " referenced before declaration"
				)
			);
			return;
		}
	}

	public visitFunctionDeclarationNode(node: FunctionDeclarationNode): void {
		node.block.accept(this);
	}

	public visitFunctionReferenceNode(node: FunctionReferenceNode): void {}

	public visitPrefixExpressionNode(node: PrefixExpressionNode): void {
		node.rhs.accept(this);
		const type = node.type(this.env);
		switch (node.operatorType) {
			case TokenType.Bang:
				return;
			case TokenType.Plus:
			case TokenType.Minus:
				if (!type.equivalent(Num)) {
					this.mismatch(node.token, Num, type);
				}
				break;
			case TokenType.PlusPlus:
			case TokenType.MinusMinus:
				if (!type.equivalent(Num)) {
					this.mismatch(node.token, Num, type);
				}
				if (!type.isAssignable) {
					this.badAssignment(node.token, type);
				}
		}
	}

	public visitPostfixExpressionNode(node: PostfixExpressionNode): void {
		node.lhs.accept(this);
		const type = node.type(this.env);
		switch (node.operatorType) {
			case TokenType.PlusPlus:
			case TokenType.MinusMinus:
				if (!type.equivalent(Num)) {
					this.mismatch(node.token, Num, type);
				}
				if (!type.isAssignable) {
					this.badAssignment(node.token, type);
				}
		}
	}

	public visitInvocationExpressionNode(node: InvocationExpressionNode): void {
		const type = node.type(this.env);
		// TODO: Add better error handling for invalid action calls
		if (node.functionName && this.ast.functionTable.has(node.functionName)) {
			const functionInfo = this.ast.functionTable.get(node.functionName!)!;
			const functionType = constructFunctionType(functionInfo);
			if (type.satisfiesRecordType(functionType.parameters)) {
				this.mismatch(node.token, functionType.parameters, type);
			}
		} else {
			// TODO: Semantic error here for unrecognized function
		}
	}

	public visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void {}

	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {
		node.lhs.accept(this);
		node.rhs.accept(this);
		// TODO: Fill this in
	}

	public visitBinaryLogicalExpressionNode(
		node: BinaryLogicalExpressionNode
	): void {}

	public visitTernaryConditionalNode(node: TernaryConditionalNode): void {
		node.predicate.accept(this);
		node.consequent.accept(this);
		node.alternate.accept(this);
	}

	public visitAssignmentExpressionNode(node: AssignmentExpressionNode): void {
		node.lhs.accept(this);
		node.rhs.accept(this);
		const lhsType = node.lhs.type(this.env);
		const rhsType = node.rhs.type(this.env);
		console.log(lhsType.equivalent(rhsType));
		if (!lhsType.equivalent(rhsType)) {
			this.mismatch(node.lhs.token, lhsType, rhsType);
		}
	}

	public visitReturnStatementNode(node: ReturnStatementNode): void {
		if (node.expr) node.expr!.accept(this);
	}

	public visitExpressionStatementNode(node: ExpressionStatementNode): void {
		node.expr.accept(this);
	}
}
