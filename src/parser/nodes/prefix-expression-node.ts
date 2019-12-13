import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { prefixTypeAnnotations, TokenType } from "../../language/token-type";
import {
	constructType,
	ErrorType,
	Type,
} from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";
import { TypeChecker } from "../../type-checker/type-checker";

export class PrefixExpressionNode extends Expression {
	/** Operator type */
	public readonly operatorType: TokenType;

	constructor(
		/** Token for the operator */
		public readonly token: TokenLike,
		/** Right-hand side expression */
		public readonly rhs: Expression
	) {
		super(token.pos, rhs.end);
		this.operatorType = token.type;
		this.rhs = rhs;
	}

	public type(ast: AbstractSyntaxTree): Type {
		const rhsType = this.rhs.type(ast);
		const annotation = prefixTypeAnnotations.get(this.token.type);
		if (annotation) {
			return constructType(annotation, rhsType.isAssignable);
		}
		return new ErrorType(rhsType.isAssignable);
	}

	public validate(tc: TypeChecker): void {}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitPrefixExpressionNode?.(this);
	}
}
