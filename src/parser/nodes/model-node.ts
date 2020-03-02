import { Expression, NodeState } from "src/language/node";
import { PropertyInfo } from "src/language/property-info";
import { TokenLike } from "src/language/token";
import { Environment } from "src/language/types/environment";
import { ModelType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";

export class ModelNode extends Expression {
	constructor(
		token: TokenLike,
		public readonly name: string,

		/** Initialization parameters (similar to Kotlin class) */
		public readonly initParams: PropertyInfo[],
		/** Child property declaration nodes */
		public readonly propertyDeclarations: VariableDeclarationNode[]
	) {
		super(token, token.pos, token.end);
	}

	public setState(state: NodeState): void {
		this.state = state;
		this.initParams.forEach(param => {
			param.defaultValue?.setState({
				...state,
				parent: this,
				isDead: false,
				isLast: param === this.initParams[this.initParams.length - 1],
			});
		});
	}

	public type(env: Environment): Type {
		// Examine the child variable declaration nodes to determine our
		// property types
		const propertyTypes: Map<string, Type> = new Map();
		for (const decl of this.propertyDeclarations) {
			const propertyType = decl.type(env);
			const propertyName = decl.variableName;
			propertyTypes.set(propertyName, propertyType);
		}
		return new ModelType(this.name, propertyTypes, [], [], []);
	}

	public accept(visitor: Visitor): void {
		visitor.visitModelNode?.(this);
	}
}
