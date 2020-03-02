import { Expression, NodeState } from "src/language/node";
import { PropertyInfo } from "src/language/property-info";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { ModelType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";

export class ModelNode extends Expression {
	constructor(
		token: TokenLike,
		public readonly name: string,

		/** Instance properties for this model */
		public readonly properties: PropertyInfo[]
	) {
		super(token, token.pos, token.end);
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.properties.forEach(property => {
			property.defaultValue?.setState({
				...state,
				parent: this,
				isDead: false,
				isLast: property === this.properties[this.properties.length - 1],
			});
		});
	}

	public type(env: Environment): Type {
		// Construct a type for each property
		const propertyTypeMap: Map<string, Type> = new Map();
		for (const property of this.properties) {
			propertyTypeMap.set(
				property.name,
				Type.construct(property.typeAnnotation, !property.isImmutable)
			);
		}
		return new ModelType(this.name, propertyTypeMap, [], [], []);
	}

	public accept(visitor: Visitor): void {
		visitor.visitModelNode?.(this);
	}
}
