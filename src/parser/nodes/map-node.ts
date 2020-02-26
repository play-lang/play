import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { ErrorType, MapType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class MapNode extends Expression {
	constructor(
		token: TokenLike,
		/** Key expressions */
		public readonly keys: Expression[],
		/** Corresponding value expressions */
		public readonly values: Expression[]
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
			return new ErrorType();
		}
		// TODO: Infer type based on all values
		const type = this.values[0].type(env);
		return new MapType(type);
	}

	public accept(visitor: Visitor): void {
		visitor.visitMapNode?.(this);
	}
}
