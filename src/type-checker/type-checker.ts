import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { Node } from "src/language/node";
import { SemanticError } from "src/language/semantic-error";
import { TokenLike } from "src/language/token";
import { TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import { ErrorType, Num, SumType, Type } from "src/language/types/type-system";
import { AssignmentExpressionNode } from "src/parser/nodes/assignment-expression-node";
import { BinaryExpressionNode } from "src/parser/nodes/binary-expression-node";
import { BinaryLogicalExpressionNode } from "src/parser/nodes/binary-logical-expression-node";
import { BlockStatementNode } from "src/parser/nodes/block-statement-node";
import { DoWhileStatementNode } from "src/parser/nodes/do-while-statement-node";
import { ElseStatementNode } from "src/parser/nodes/else-statement-node";
import { ExpressionStatementNode } from "src/parser/nodes/expression-statement-node";
import { FunctionDeclarationNode } from "src/parser/nodes/function-declaration-node";
import { IdExpressionNode } from "src/parser/nodes/id-expression-node";
import { IfStatementNode } from "src/parser/nodes/if-statement-node";
import { InvocationExpressionNode } from "src/parser/nodes/invocation-expression-node";
import { PostfixExpressionNode } from "src/parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "src/parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "src/parser/nodes/primitive-expression-node";
import { ProgramNode } from "src/parser/nodes/program-node";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";
import { TernaryConditionalNode } from "src/parser/nodes/ternary-conditional-node";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";
import { WhileStatementNode } from "src/parser/nodes/while-statement-node";
import { TypeCheckError } from "src/type-checker/type-check-error";

export class TypeChecker {
	/** Current type checking environment */
	public get env(): Environment {
		return this.ast.env;
	}

	/* Type checker errors encountered while checking types */
	public errors: SemanticError[] = [];

	constructor(
		/** Abstract syntax tree to validate */
		public readonly ast: AbstractSyntaxTree
	) {}

	/**
	 * Find the name of the function which contains the specified syntax
	 * tree node
	 *
	 * If the node is not contained inside a function, it returns the
	 * main context's name
	 *
	 * @param node The node to find the parent function of
	 */
	public parentFunction(node: Node): string {
		let n = node.parent;
		while (n && !(n instanceof FunctionDeclarationNode)) {
			n = n.parent;
		}
		if (n) {
			return n.info.name;
		}
		return "(main)";
	}

	// MARK: Methods

	public check(): boolean {
		// Reset everything
		this.errors = [];
		// Reset our position within the symbol table (doesn't delete data)
		this.env.symbolTable.reset();

		// Compute function types before checking types
		for (const key of this.env.functionTable.keys()) {
			const info = this.env.functionTable.get(key)!;
			if (!info.type) {
				// Compute the type of the function
				info.type = Type.constructFunction(info);
			}
		}

		this.checkNode(this.ast.root);

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
	public checkProgram(node: ProgramNode): void {
		for (const statement of node.statements) {
			this.checkNode(statement);
		}
	}

	public checkBlockStatement(node: BlockStatementNode): void {
		// Scope is entered/exited manually for function blocks
		// in visitFunctionDeclarationNode
		if (!node.isFunctionBlock) this.env.symbolTable.enterScope();
		for (const statement of node.statements) {
			this.checkNode(statement);
		}
		if (!node.isFunctionBlock) this.env.symbolTable.exitScope();
	}

	public checkIfStatement(node: IfStatementNode): void {
		this.checkNode(node.predicate);
		this.checkNode(node.consequent);
		for (const alternate of node.alternates) {
			this.checkNode(alternate);
		}
	}

	public checkElseStatement(node: ElseStatementNode): void {
		if (node.expr) this.checkNode(node.expr);
		this.checkNode(node.block);
	}

	public checkVariableDeclaration(node: VariableDeclarationNode): void {
		const scope = this.env.symbolTable.scope.findScope(node.variableName);
		if (!scope) {
			this.report(
				new SemanticError(node.token, "Variable not found in scope")
			);
			return;
		}
		// Visit the assignment expression that might follow a variable declaration:
		if (node.expr) this.checkNode(node.expr);
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

	public checkIdExpression(node: IdExpressionNode): void {
		if (node.usedAsFunction) {
			// TODO: Id is used as a function reference, make sure function exists
		} else {
			const scope = this.env.symbolTable.scope.findScope(node.name);
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

	public checkFunctionDeclaration(node: FunctionDeclarationNode): void {
		this.env.symbolTable.enterScope();
		// Compute types for parameters
		for (const parameter of node.info.parameters) {
			// Walk through each parameter, find its type information from the
			// function info object attached to the node, look up the entry in the
			// function's scope and resolve the parameter types for later use
			const typeAnnotation = node.info.parameterTypes.get(parameter);
			const idSymbol = this.env.symbolTable.scope.lookup(parameter);
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
		this.checkNode(node.block);
		this.env.symbolTable.exitScope();
	}

	public checkPrefixExpression(node: PrefixExpressionNode): void {
		this.checkNode(node.rhs);
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

	public checkPostfixExpression(node: PostfixExpressionNode): void {
		this.checkNode(node.lhs);
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

	public checkInvocationExpression(node: InvocationExpressionNode): void {
		const type = node.argumentsType(this.env);
		// TODO: Add better error handling for invalid action calls
		const functionName = node.functionName;
		if (functionName && this.env.functionTable.has(functionName)) {
			const info = this.env.functionTable.get(functionName)!;
			// Function types are pre-computed before type checking so this should
			// be safe
			const functionType = info.type!;
			if (!type.satisfiesRecordType(functionType.parameters)) {
				this.mismatch(node.token, functionType.parameters, type);
			}

			// TODO: Check for tail recursion so the compiler can output the correct
			// bytecode for recursive calls
			if (node.parent instanceof ReturnStatementNode) {
				// Find the name of the enclosing function
				const parentFuncName = this.parentFunction(node.parent);
				if (parentFuncName === node.functionName) {
					// TODO: Also check for class equivalence to avoid incorrect tail-call
					// optimizations for methods that are in different classes but share
					// the same names
					node.isTailRecursive = true;
				}
			}
		} else {
			// TODO: Semantic error here for unrecognized function
			throw new Error("Can't find function " + node.functionName);
		}
	}

	public checkPrimitiveExpression(node: PrimitiveExpressionNode): void {
		if (node.type(this.env) instanceof ErrorType) {
			this.error(
				node.token,
				"Failed to resolve type for " + node.token.lexeme
			);
		}
	}

	public checkBinaryExpression(node: BinaryExpressionNode): void {
		this.checkNode(node.lhs);
		this.checkNode(node.rhs);
		const lhsType = node.lhs.type(this.env);
		const rhsType = node.rhs.type(this.env);
		const allowedType = node.operandType(this.env);
		if (
			!allowedType.accepts(lhsType) ||
			!allowedType.accepts(rhsType) ||
			(allowedType instanceof SumType && !lhsType.equivalent(rhsType))
		) {
			// Both types must be accepted by the allowed type, and if the allowed
			// type represents a union (sum type), the types must also be equivalent
			// (represent the same type)
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
	}

	public checkBinaryLogicalExpression(
		node: BinaryLogicalExpressionNode
	): void {}

	public checkTernaryConditional(node: TernaryConditionalNode): void {
		this.checkNode(node.predicate);
		this.checkNode(node.consequent);
		this.checkNode(node.alternate);
		const consequentType = node.consequent.type(this.env);
		const alternateType = node.alternate.type(this.env);
		// Ensure that consequent and alternate return same type of value
		if (!consequentType.equivalent(alternateType)) {
			this.mismatch(node.alternate.token, consequentType, alternateType);
		}
	}

	public checkAssignmentExpression(node: AssignmentExpressionNode): void {
		this.checkNode(node.lhs);
		this.checkNode(node.rhs);
		const lhsType = node.lhs.type(this.env);
		const rhsType = node.rhs.type(this.env);
		if (!lhsType.isAssignable) {
			this.badAssignment(node.lhs.token, lhsType);
		} else if (!lhsType.accepts(rhsType)) {
			this.mismatch(node.lhs.token, lhsType, rhsType);
		}
	}

	public checkReturnStatement(node: ReturnStatementNode): void {
		if (node.expr) this.checkNode(node.expr);
	}

	public checkExpressionStatement(node: ExpressionStatementNode): void {
		this.checkNode(node.expr);
	}

	public checkDoWhileStatement(node: DoWhileStatementNode): void {
		this.checkNode(node.block);
		this.checkNode(node.condition);
	}

	public checkWhileStatement(node: WhileStatementNode): void {
		this.checkNode(node.condition);
		this.checkNode(node.block);
	}

	// MARK: Private methods

	/**
	 * Type check a given node
	 *
	 * This examines the type of node given and calls the appropriate routine,
	 * passing any needed state around
	 *
	 * @param node The node to check
	 */
	private checkNode(node: Node): void {
		switch (true) {
			case node instanceof AssignmentExpressionNode:
				this.checkAssignmentExpression(
					node as AssignmentExpressionNode
				);
				break;
			case node instanceof BinaryExpressionNode:
				this.checkBinaryExpression(node as BinaryExpressionNode);
				break;
			case node instanceof BinaryLogicalExpressionNode:
				this.checkBinaryLogicalExpression(
					node as BinaryLogicalExpressionNode
				);
				break;
			case node instanceof BlockStatementNode:
				this.checkBlockStatement(node as BlockStatementNode);
				break;
			case node instanceof DoWhileStatementNode:
				this.checkDoWhileStatement(node as DoWhileStatementNode);
				break;
			case node instanceof ElseStatementNode:
				this.checkElseStatement(node as ElseStatementNode);
				break;
			case node instanceof ExpressionStatementNode:
				this.checkExpressionStatement(node as ExpressionStatementNode);
				break;
			case node instanceof FunctionDeclarationNode:
				this.checkFunctionDeclaration(node as FunctionDeclarationNode);
				break;
			case node instanceof IdExpressionNode:
				this.checkIdExpression(node as IdExpressionNode);
				break;
			case node instanceof IfStatementNode:
				this.checkIfStatement(node as IfStatementNode);
				break;
			case node instanceof InvocationExpressionNode:
				this.checkInvocationExpression(
					node as InvocationExpressionNode
				);
				break;
			case node instanceof PostfixExpressionNode:
				this.checkPostfixExpression(node as PostfixExpressionNode);
				break;
			case node instanceof PrefixExpressionNode:
				this.checkPrefixExpression(node as PrefixExpressionNode);
				break;
			case node instanceof PrimitiveExpressionNode:
				this.checkPrimitiveExpression(node as PrimitiveExpressionNode);
				break;
			case node instanceof ProgramNode:
				this.checkProgram(node as ProgramNode);
				break;
			case node instanceof ReturnStatementNode:
				this.checkReturnStatement(node as ReturnStatementNode);
				break;
			case node instanceof TernaryConditionalNode:
				this.checkTernaryConditional(node as TernaryConditionalNode);
				break;
			case node instanceof VariableDeclarationNode:
				this.checkVariableDeclaration(node as VariableDeclarationNode);
				break;
			case node instanceof WhileStatementNode:
				this.checkWhileStatement(node as WhileStatementNode);
				break;
		}
	}
}
