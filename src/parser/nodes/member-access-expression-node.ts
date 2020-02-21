import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { ErrorType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { InvocationExpressionNode } from "src/parser/nodes/invocation-expression-node";

export class MemberAccessExpressionNode extends Expression {
	/** True if the member access operation is used as an l-value */
	public lValue: boolean = false;

	constructor(
		token: TokenLike,
		/** Expression resolving to something that can be indexed */
		public readonly lhs: Expression,
		/** Expression for member to access */
		public readonly member: Expression
	) {
		super(token, token.pos, member.token.end);
		if (member instanceof InvocationExpressionNode) {
			// If the member to access is a function call, we need to inform it that
			// it is likely a method call so that it can be type-checked correctly
			member.receiver = lhs;
		}
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.lhs.setState({ ...state, parent: this });
		this.member.setState({ ...state, parent: this });
	}

	public type(env: Environment): Type {
		// TODO: Compute member type
		return new ErrorType(false);
	}

	public accept(visitor: Visitor): void {
		visitor.visitMemberAccessExpressionNode?.(this);
	}
}
