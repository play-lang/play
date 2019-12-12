import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { postfixTypeAnnotations, TokenType } from "../../language/token-type";
import {
	constructType,
	ErrorType,
	Num,
	Type,
} from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";
import { TypeChecker } from "../../type-checker/type-checker";

export class PostfixExpressionNode extends Expression {
	/** Operator type */
	public readonly operatorType: TokenType;

	constructor(
		/** Token for the operator */
		public readonly token: TokenLike,
		/** Left-hand side expression */
		public readonly lhs: Expression
	) {
		super(lhs.start, token.end);
		this.operatorType = token.type;
		this.lhs = lhs;
	}

	public type(ast: AbstractSyntaxTree): Type {
		const lhsType = this.lhs.type(ast);
		const annotation = postfixTypeAnnotations.get(this.token.type);
		if (annotation) {
			return constructType(annotation, lhsType.isAssignable);
		}
		return new ErrorType(lhsType.isAssignable);
	}

	public validate(tc: TypeChecker): void {
		const type = this.type(tc.ast);
		switch (this.operatorType) {
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

	public accept(visitor: Visitor): void {
		visitor.visitPostfixExpressionNode(this);
	}
}
