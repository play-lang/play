import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { prefixTypeAnnotations, TokenType } from "../../language/token-type";
import {
	constructType,
	ErrorType,
	Num,
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

	public validate(tc: TypeChecker): void {
		const type = this.type(tc.ast);
		switch (this.operatorType) {
			case TokenType.Bang:
				return;
			case TokenType.Plus:
			case TokenType.Minus:
				if (!type.equivalent(Num)) {
					tc.mismatch(this.token, Num, type);
				}
				break;
			case TokenType.PlusPlus:
			case TokenType.MinusMinus:
				if (!type.equivalent(Num)) {
					tc.mismatch(this.token, Num, type);
				}
				if (!type.isAssignable) {
					tc.badAssignment(this.token, type);
				}
		}
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitPrefixExpressionNode(this);
	}
}
