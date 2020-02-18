import { Expression, NodeState, Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { None, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export enum RepresentedCollectionType {
	Unknown,
	Set,
	List,
}

export class SetOrListNode extends Statement {
	constructor(
		token: TokenLike,
		/** Expressions comprising the members of the set or list */
		public readonly members: Expression[],
		/** The type of collection this node represents */
		public representedCollectionType: RepresentedCollectionType = RepresentedCollectionType.Unknown
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
		return None;
	}

	public accept(visitor: Visitor): void {
		visitor.visitSetOrListNode?.(this);
	}
}
