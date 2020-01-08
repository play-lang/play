import { Visitor } from "src/language/visitor";
import { AssignmentExpressionNode } from "src/parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "src/parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "src/parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";
import { ExpressionStatementNode } from "src/parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "src/parser/nodes/function-declaration-node";
import { InvocationExpressionNode } from "src/parser/nodes/invocation-expression-node";
import { PostfixExpressionNode } from "src/parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "src/parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "src/parser/nodes/primitive-expression-node";
import { ProgramNode } from "src/parser/nodes/program-node";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";
import { TernaryConditionalNode } from "src/parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";

import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { FunctionInfo } from "src/language/function-info";
import { SemanticError } from "src/language/semantic-error";
import { SymbolTable } from "src/language/symbol-table";
import { TokenLike } from "src/language/token";
import { TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import {
	constructFunctionType,
	ErrorType,
	Num,
	Type,
} from "src/language/types/type-system";
import { IdExpressionNode } from "src/parser/nodes/id-expression-node";
import { TypeCheckError } from "src/type-checker/type-check-error";

export class TypeChecker implements Visitor {
	/** Current type checking environment */
	public get env(): Environment {
		return this.ast.env;
	}
	/* Type checker errors encountered while checking types */
	public errors: SemanticError[] = [];

	/** Global scope */
	private globalScope: SymbolTable;
	/** Symbol table for the current scope */
	private symbolTable: SymbolTable;
	/** Function table for the environment */
	private functionTable: Map<string, FunctionInfo>;

	/** Index of the next child scope to visit for each scope level */
	private childScopeIndices: number[] = [0];
	/** Number of scopes deep we are--used as an index to childScopeIndices */
	private scopeDepth: number = 0;

	constructor(
		/** Abstract syntax tree to validate */
		public readonly ast: AbstractSyntaxTree
	) {
		this.symbolTable = ast.env.symbolTable;
		this.globalScope = ast.env.symbolTable;
		this.functionTable = ast.env.functionTable;
	}

	// MARK: Methods

	public check(): boolean {
		// Reset everything
		this.errors = [];
		this.childScopeIndices = [0];
		this.scopeDepth = 0;

		// Compute function types before checking types
		for (const key of this.functionTable.keys()) {
			const info = this.functionTable.get(key)!;
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
		const hint = `${prefix} Invalid assignment�expected a variable reference to ${pretty}`;
		const error = new SemanticError(token, hint);
		this.errors.push(error);
	}

	/**
	 * Register an error with a binary expression
	 * @param token The binary expression token where the error occurred
	 * @param message Description of the problem
	 */
	public badBinaryExp(token: TokenLike, message: string): void {
		const prefix = this.errorPrefix(token);
		const hint = `${prefix} ${message}`;
		const error = new TypeCheckError(token, hint);
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
		const scope = this.symbolTable.findScope(node.variableName);
		if (!scope) {
			this.report(
				new SemanticError(
					node.token,
					"Variable not found in symbol table"
				)
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

	public visitIdExpressionNode(node: IdExpressionNode): void {
		if (node.usedAsFunction) {
			// TODO: Id is used as a function reference, make sure function exists
		} else {
			const scope = this.symbolTable.findScope(node.name);
			if (!scope) {
				this.report(
					new SemanticError(
						node.token,
						"Variable " +
							node.name +
							" referenced before declaration"
					)
				);
			}
		}
	}

	public visitFunctionDeclarationNode(node: FunctionDeclarationNode): void {
		node.block.accept(this);
	}

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
		if (node.functionName && this.functionTable.has(node.functionName)) {
			const functionInfo = this.functionTable.get(node.functionName!)!;
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
		const lhsType = node.lhs.type(this.env);
		const rhsType = node.rhs.type(this.env);
		const exprType = node.type(this.env);
		if (exprType instanceof ErrorType) {
			this.badBinaryExp(
				node.token,
				"Cannot use " +
					lhsType.description +
					" to " +
					node.action(this.env) +
					" with " +
					rhsType.description
			);
		}
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
		if (!lhsType.equivalent(rhsType)) {
			this.mismatch(node.lhs.token, lhsType, rhsType);
		}
		if (!lhsType.isAssignable) {
		}
	}

	public visitReturnStatementNode(node: ReturnStatementNode): void {
		if (node.expr) node.expr!.accept(this);
	}

	public visitExpressionStatementNode(node: ExpressionStatementNode): void {
		node.expr.accept(this);
	}
}
