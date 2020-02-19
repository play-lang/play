import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { Node } from "src/language/node";
import { SemanticError } from "src/language/semantic-error";
import { TokenLike } from "src/language/token";
import { TokenType } from "src/language/token-type";
import { Environment } from "src/language/types/environment";
import {
	Collection,
	CollectionType,
	ErrorType,
	Num,
	Str,
	SumType,
	Type,
} from "src/language/types/type-system";
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
import { IndexExpressionNode } from "src/parser/nodes/index-expression-node";
import { InvocationExpressionNode } from "src/parser/nodes/invocation-expression-node";
import { PostfixExpressionNode } from "src/parser/nodes/postfix-expression-node";
import { PrefixExpressionNode } from "src/parser/nodes/prefix-expression-node";
import { PrimitiveExpressionNode } from "src/parser/nodes/primitive-expression-node";
import { ProgramNode } from "src/parser/nodes/program-node";
import { ReturnStatementNode } from "src/parser/nodes/return-statement-node";
import { SetOrListNode } from "src/parser/nodes/set-or-list-node";
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
	 * @param desc Additional information about the token to go inside a
	 * parenthetical, if any
	 */
	private mismatch(
		token: TokenLike,
		expectedType: Type,
		encounteredType: Type,
		desc: string = ""
	): void {
		const prettyExpectedType = expectedType.description;
		const prettyEncounteredType = encounteredType.description;
		const prefix = this.errorPrefix(token);
		const hint = `${prefix} Expected \`${token.lexeme}\`${
			desc ? " (" + desc + ") " : " "
		}to have type ${prettyExpectedType} instead of ${prettyEncounteredType}`;
		const error = new TypeCheckError(token, hint);
		this.errors.push(error);
	}

	/**
	 * Register an invalid assignment error with the type checker
	 * @param token The token where the error occurred
	 * @param expectedType The expected type
	 * @param encounteredType The encountered type
	 */
	private badAssignment(token: TokenLike, expectedType: Type): void {
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
	private error(token: TokenLike, message: string): void {
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
	private report(error: SemanticError): void {
		this.errors.push(error);
	}

	/**
	 * Describes a type error prefix string based on an error token
	 * @param token The token where the error occurred
	 */
	private errorPrefix(token: TokenLike): string {
		const prefix =
			"Type error in " +
			token.file.name +
			" at " +
			token.line +
			":" +
			token.column +
			" (" +
			token.pos +
			") with token `" +
			token.lexeme +
			"`: ";
		return prefix;
	}

	// MARK: Type Checking Routines

	private checkAssignmentExpression(node: AssignmentExpressionNode): void {
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

	private checkBinaryExpression(node: BinaryExpressionNode): void {
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

	private checkBinaryLogicalExpression(
		node: BinaryLogicalExpressionNode
	): void {}

	private checkBlockStatement(node: BlockStatementNode): void {
		// Scope is entered/exited manually for function blocks
		// in visitFunctionDeclarationNode
		if (!node.isFunctionBlock) this.env.symbolTable.enterScope();
		for (const statement of node.statements) {
			this.checkNode(statement);
		}
		if (!node.isFunctionBlock) this.env.symbolTable.exitScope();
	}

	private checkDoWhileStatement(node: DoWhileStatementNode): void {
		this.checkNode(node.block);
		this.checkNode(node.condition);
	}

	private checkElseStatement(node: ElseStatementNode): void {
		if (node.expr) this.checkNode(node.expr);
		this.checkNode(node.block);
	}

	private checkExpressionStatement(node: ExpressionStatementNode): void {
		this.checkNode(node.expr);
	}

	private checkFunctionDeclaration(node: FunctionDeclarationNode): void {
		this.env.symbolTable.enterScope();
		if (!(node.parent instanceof ProgramNode)) {
			// TODO: Allow functions to also exist inside models
			this.error(
				node.token,
				"Functions can only be declared at the global level"
			);
		}
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

	private checkIdExpression(node: IdExpressionNode): void {
		if (node.usedAsFunction) {
			// TODO: Id is used as a function reference, make sure function exists
		} else {
			const scope = this.env.symbolTable.scope.findScope(node.name);
			if (!scope) {
				this.report(
					new SemanticError(
						node.token,
						"Variable " + node.name + " referenced before declaration"
					)
				);
			}
		}
	}

	private checkIfStatement(node: IfStatementNode): void {
		this.checkNode(node.predicate);
		this.checkNode(node.consequent);
		for (const alternate of node.alternates) {
			this.checkNode(alternate);
		}
	}

	private checkIndexExpression(node: IndexExpressionNode): void {
		this.checkNode(node.lhs);
		this.checkNode(node.index);
		const lhsType = node.lhs.type(this.env);
		const indexType = node.index.type(this.env);

		if (!(lhsType instanceof CollectionType)) {
			this.error(
				node.lhs.token,
				"The index operator [] can only be used on collection types"
			);
			return;
		}

		switch (lhsType.collection) {
			case Collection.List:
				// Lists need numeric keys
				if (!indexType.equivalent(Num)) {
					this.mismatch(node.index.token, Num, indexType);
				}
				break;
			case Collection.Map:
				// Maps need string keys
				if (!indexType.equivalent(Str)) {
					this.mismatch(node.index.token, Str, indexType);
				}
				break;
			case Collection.Set:
				// Sets need the type of elements they store as keys
				if (!indexType.equivalent(lhsType.elementType)) {
					this.mismatch(node.index.token, lhsType.elementType, indexType);
				}
		}
	}

	private checkInvocationExpression(node: InvocationExpressionNode): void {
		const type = node.argumentsType(this.env);
		const functionName = node.functionName;
		if (functionName && this.env.functionTable.has(functionName)) {
			const info = this.env.functionTable.get(functionName)!;
			// Function types are pre-computed before type checking so this should
			// be safe
			const functionType = info.type!;
			if (!type.satisfiesRecordType(functionType.parameters)) {
				this.mismatch(
					node.lhs.token,
					functionType.parameters,
					type,
					"to be invoked as a function call"
				);
			}
		} else {
			// TODO: Semantic error here for unrecognized function
			throw new Error("Can't find function " + node.functionName);
		}
	}

	private checkPostfixExpression(node: PostfixExpressionNode): void {
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

	private checkPrefixExpression(node: PrefixExpressionNode): void {
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

	private checkPrimitiveExpression(node: PrimitiveExpressionNode): void {
		if (node.type(this.env) instanceof ErrorType) {
			this.error(node.token, "Failed to resolve type for " + node.token.lexeme);
		}
	}

	private checkProgram(node: ProgramNode): void {
		for (const statement of node.statements) {
			this.checkNode(statement);
		}
	}

	private checkReturnStatement(node: ReturnStatementNode): void {
		if (node.expr) this.checkNode(node.expr);
	}

	private checkSetOrList(node: SetOrListNode): void {
		if (node.members.length < 1) return;
		const itemType = node.members[0].type(this.env);
		for (let i = 1; i < node.members.length; i++) {
			const type = node.members[i].type(this.env);
			if (!itemType.equivalent(type)) {
				this.mismatch(
					node.members[i].token,
					itemType,
					type,
					"for collection member"
				);
			}
		}
	}

	private checkTernaryConditional(node: TernaryConditionalNode): void {
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

	private checkVariableDeclaration(node: VariableDeclarationNode): void {
		const scope = this.env.symbolTable.scope.findScope(node.variableName);
		if (!scope) {
			this.report(new SemanticError(node.token, "Variable not found in scope"));
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

	private checkWhileStatement(node: WhileStatementNode): void {
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
				this.checkAssignmentExpression(node as AssignmentExpressionNode);
				break;
			case node instanceof BinaryExpressionNode:
				this.checkBinaryExpression(node as BinaryExpressionNode);
				break;
			case node instanceof BinaryLogicalExpressionNode:
				this.checkBinaryLogicalExpression(node as BinaryLogicalExpressionNode);
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
			case node instanceof IndexExpressionNode:
				this.checkIndexExpression(node as IndexExpressionNode);
				break;
			case node instanceof InvocationExpressionNode:
				this.checkInvocationExpression(node as InvocationExpressionNode);
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
			case node instanceof SetOrListNode:
				this.checkSetOrList(node as SetOrListNode);
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
