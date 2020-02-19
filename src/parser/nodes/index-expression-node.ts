import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import {
	CollectionType,
	ErrorType,
	Type,
} from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class IndexExpressionNode extends Expression {
	/** True if the index operation is used as an l-value, false if an r-value */
	public lValue: boolean = false;

	constructor(
		token: TokenLike,
		/** Expression resolving to something that can be indexed */
		public readonly lhs: Expression,
		/** Expression resolving to an index value */
		public readonly index: Expression,
		/** End token position */
		public readonly end: number
	) {
		super(token, token.pos, end);
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.lhs.setState({ ...state, parent: this });
		this.index.setState({ ...state, parent: this });
	}

	public type(env: Environment): Type {
		const lhsType = this.lhs.type(env);
		if (lhsType instanceof CollectionType) {
			// An index operation returns an element of whatever kind the collection
			// that it indexes into holds
			const elementType = lhsType.elementType.copy();
			elementType.isAssignable = this.lValue;
			return elementType;
		}
		return new ErrorType(false);
	}

	public accept(visitor: Visitor): void {
		visitor.visitIndexExpressionNode?.(this);
	}
}
