import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import {
	Any,
	Collection,
	CollectionType,
	Type,
} from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export enum RepresentedCollectionType {
	Set,
	List,
}

export class MapNode extends Expression {
	constructor(
		token: TokenLike,
		/** Expressions comprising the members of the set or list */
		public readonly keys: Expression[],
		public readonly values: Expression[],
		/** The type of collection this node represents */
		public representedCollectionType: RepresentedCollectionType = RepresentedCollectionType.List
	) {
		super(
			token,
			token.pos,
			values.length > 0 ? values[values.length - 1].end : token.end
		);
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.keys.forEach(key =>
			key.setState({
				...state,
				isLast: key === this.keys[this.keys.length - 1],
				parent: this,
			})
		);
		this.values.forEach(value =>
			value.setState({
				...state,
				isLast: value === this.values[this.values.length - 1],
				parent: this,
			})
		);
	}

	public type(env: Environment): Type {
		if (this.keys.length < 1) {
			return new CollectionType(Collection.Map, Any, false);
		}
		// TODO: Infer type based on all values
		const type = this.values[0].type(env);
		return new CollectionType(Collection.Map, type, false);
	}

	public accept(visitor: Visitor): void {
		visitor.visitMapNode?.(this);
	}
}
