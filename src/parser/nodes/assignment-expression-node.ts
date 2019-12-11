import { Expression } from "../../language/node";
import { TokenLike } from "../../language/token";
import { TokenType } from "../../language/token-type";
import {
	AddressConstraint,
	TypeRule,
	TypeRuleset,
} from "../../language/type-system";
import { Visitor } from "../../language/visitor";
import { TypeChecker } from "../../type-checker/type-checker";

export class AssignmentExpressionNode extends Expression {
	constructor(
		public readonly token: TokenLike,
		public readonly assignmentType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(lhs.start, rhs.end);
	}

	// MARK: Expression

	public get ruleset(): TypeRuleset {
		return new TypeRuleset([
			// Match any value variable
			new TypeRule(["num"], AddressConstraint.AddressableOnly),
			new TypeRule(["str"], AddressConstraint.AddressableOnly),
			new TypeRule(["bool"], AddressConstraint.AddressableOnly),
			new TypeRule(["object"], AddressConstraint.AddressableOnly),
			// Match any collection variable, as well
			new TypeRule(["list"], AddressConstraint.AddressableOnly),
			new TypeRule(["map"], AddressConstraint.AddressableOnly),
			new TypeRule(["set"], AddressConstraint.AddressableOnly),
		]);
	}

	public validate(tc: TypeChecker): void {
		const lhsType = this.lhs.computeReturnType(tc);
		const rhsType = this.rhs.computeReturnType(tc);
		if (!this.ruleset.matchMultiple(lhsType, rhsType)) {
			tc.assertType(this.token, this.ruleset, rhsType);
		}
	}

	public computeReturnType(tc: TypeChecker): TypeRule {
		// Assignments return the left-hand side
		return this.lhs.computeReturnType(tc);
	}

	public get isAddressable(): boolean {
		// The result of an assignment is addressable if the left-hand-side
		// is addressable
		return this.lhs.isAddressable;
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitAssignmentExpressionNode(this);
	}
}
