import { Expression, NodeState, Statement } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import {
	Collection,
	CollectionType,
	ErrorType,
	Type,
} from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export enum RepresentedCollectionType {
	Set,
	List,
}

export class SetOrListNode extends Statement {
	constructor(
		token: TokenLike,
		/** Expressions comprising the members of the set or list */
		public readonly members: Expression[],
		/** The type of collection this node represents */
		public representedCollectionType: RepresentedCollectionType = RepresentedCollectionType.List
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
		if (this.members.length < 1) return new ErrorType(false);
		const type = this.members[0].type(env);
		switch (this.representedCollectionType) {
			case RepresentedCollectionType.List:
				return new CollectionType(Collection.List, type, false);
			case RepresentedCollectionType.Set:
				return new CollectionType(Collection.Set, type, false);
		}
	}

	public accept(visitor: Visitor): void {
		visitor.visitSetOrListNode?.(this);
	}
}
