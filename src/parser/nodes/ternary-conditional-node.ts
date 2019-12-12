import { AbstractSyntaxTree } from "../../language/abstract-syntax-tree";
import { Expression } from "../../language/node";
import { Type } from "../../language/types/type-system";
import { Visitor } from "../../language/visitor";
import { TypeChecker } from "../../type-checker/type-checker";

export class TernaryConditionalNode extends Expression {
	constructor(
		/** Expression to examine */
		public readonly predicate: Expression,
		/** Expression to evaluate if predicate is true */
		public readonly consequent: Expression,
		/** Expression to evaluate if predicate is false */
		public readonly alternate: Expression
	) {
		super(predicate.start, alternate.end);
	}

	public type(ast: AbstractSyntaxTree): Type {
		// Ternary conditionals must return the same type of things regardless of
		// predicate's outcome
		// The alternate must have the same type as the consequent
		return this.consequent.type(ast);
	}

	public validate(tc: TypeChecker): void {}

	public accept(visitor: Visitor): void {
		visitor.visitTernaryConditionalNode(this);
	}
}
