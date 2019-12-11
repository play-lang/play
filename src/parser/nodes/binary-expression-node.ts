import { Expression } from "../../language/node";
import { TokenType } from "../../language/token-type";
import { Visitor } from "../../language/visitor";

export class BinaryExpressionNode extends Expression {
	constructor(
		public readonly operatorType: TokenType,
		public readonly lhs: Expression,
		public readonly rhs: Expression
	) {
		super(lhs.start, rhs.end);
	}

	public get isAddressable(): boolean {
		// The result of an assignment is addressable if the left-hand-side
		// is addressable
		return this.lhs.isAddressable;
	}

	// MARK: Visitor
	public accept(visitor: Visitor): void {
		visitor.visitBinaryExpressionNode(this);
	}
}
