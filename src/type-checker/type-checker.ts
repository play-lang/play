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
import { ErrorType, Num, Type } from "src/language/types/type-system";
import { IdExpressionNode } from "src/parser/nodes/id-expression-node";
import { TypeCheckError } from "src/type-checker/type-check-error";

export class TypeChecker implements Visitor {
	/** Current type checking environment */
	public get env(): Environment {
		return this.ast.env;
	}
	/* Type checker errors encountered while checking types */
	public errors: SemanticError[] = [];

	/** Symbol table for the current scope */
	private get symbolTable(): SymbolTable {
		return this.env.symbolTable;
	}
	/** Function table for the environment */
	private get functionTable(): Map<string, FunctionInfo> {
		return this.env.functionTable;
	}

	constructor(
		/** Abstract syntax tree to validate */
		public readonly ast: AbstractSyntaxTree
	) {}

	// MARK: Methods

	public check(): boolean {
		// Reset everything
		this.errors = [];

		// Compute function types before checking types
		for (const key of this.functionTable.keys()) {
			const info = this.functionTable.get(key)!;
			if (!info.type) {
				// Compute the type of the function
				info.type = Type.constructFunction(info);
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
	 * Register a generic type checking error
	 * @param token The token where the error occurred
	 * @param message Error description
	 */
	public error(token: TokenLike, message: string): void {
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

	// MARK: Visitor
	public visitProgramNode(node: ProgramNode): void {
		for (const statement of node.statements) {
			statement.accept(this);
		}
	}

	public visitBlockStatementNode(node: BlockStatementNode): void {
		// Scope is entered/exited manually for function blocks
		// in visitFunctionDeclarationNode
		if (!node.isFunctionBlock) this.env.enterScope();
		for (const statement of node.statements) {
			statement.accept(this);
		}
		if (!node.isFunctionBlock) this.env.exitScope();
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
			const varType = node.variableType(this.env);
			const exprType = node.expr.type(this.env);
			const idSymbol = scope.lookup(node.variableName)!;
			idSymbol.type = varType;
			if (!varType.equivalent(exprType)) {
				// Report mismatch between variable's assigned value and variable's
				// expected value
				this.mismatch(node.token, varType, exprType);
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
		this.env.enterScope();
		// Compute types for parameters
		for (const parameter of node.info.parameters) {
			// Walk through each parameter, find its type information from the
			// function info object attached to the node, look up the entry in the
			// appropriate symbol table for the function's scope and resolve the
			// parameter's types for later use
			const typeAnnotation = node.info.parameterTypes.get(parameter);
			const idSymbol = this.symbolTable.lookup(parameter);
			if (typeAnnotation && idSymbol && typeAnnotation.length > 0) {
				// TODO: Support pass-by-reference assignable parameter types someday
				const type = Type.construct(typeAnnotation);
				idSymbol.type = type;
			} else {
				throw new TypeCheckError(
					node.token,
					"Failed to find type annotation or symbol table entry for parameter " +
						parameter
				);
			}
		}
		node.block.accept(this);
		this.env.exitScope();
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
			const functionType = Type.constructFunction(functionInfo);
			if (!type.satisfiesRecordType(functionType.parameters)) {
				this.mismatch(node.token, functionType.parameters, type);
			}
		} else {
			// TODO: Semantic error here for unrecognized function
		}
	}

	public visitPrimitiveExpressionNode(node: PrimitiveExpressionNode): void {
		if (node.type(this.env) instanceof ErrorType) {
			this.error(
				node.token,
				"Failed to resolve type for " + node.token.lexeme
			);
		}
	}

	public visitBinaryExpressionNode(node: BinaryExpressionNode): void {
		node.lhs.accept(this);
		node.rhs.accept(this);
		const lhsType = node.lhs.type(this.env);
		const rhsType = node.rhs.type(this.env);
		const exprType = node.type(this.env);
		if (exprType instanceof ErrorType) {
			this.error(
				node.token,
				"Failed to use " +
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
		if (!lhsType.isAssignable) {
			this.badAssignment(node.lhs.token, lhsType);
		} else if (!lhsType.equivalent(rhsType)) {
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
