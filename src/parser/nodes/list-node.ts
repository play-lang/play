import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { ErrorType, ListType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class ListNode extends Expression {
	constructor(
		token: TokenLike,
		/** Expressions comprising the members of the set or list */
		public readonly members: Expression[]
	) {
		super(
			token,
			token.pos,
			members.length > 0 ? members[members.length - 1].end : token.end
		);
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.members.forEach(member =>
			member.setState({
				...state,
				isLast: member === this.members[this.members.length - 1],
				parent: this,
			})
		);
	}

	public type(env: Environment): Type {
		if (this.members.length < 1) {
			return new ErrorType();
		}
		// TODO: Infer type based on all members
		const type = this.members[0].type(env);
		return new ListType(type);
	}

	public accept(visitor: Visitor): void {
		visitor.visitListNode?.(this);
	}
}
