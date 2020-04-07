import { LinkedHashMap } from "src/common/linked-hash-map";
import { PropertyInfo } from "src/language/info/property-info";
import { Expression, NodeState } from "src/language/node";
import { TokenLike } from "src/language/token/token";
import { Environment } from "src/language/types/environment";
import { FunctionType, RecordType, Type } from "src/language/types/type-system";
import { Visitor } from "src/language/visitor";
import { FunctionDeclarationNode } from "src/parser/nodes/function-declaration-node";
import { VariableDeclarationNode } from "src/parser/nodes/variable-declaration-node";

export class ModelNode extends Expression {
	constructor(
		token: TokenLike,
		public readonly name: string,

		/** Initialization parameters (similar to Kotlin class) */
		public readonly initParams: PropertyInfo[],
		/** Child property declaration nodes */
		public readonly propertyDeclarations: VariableDeclarationNode[],
		/** Child function declaration nodes */
		public readonly methodDeclarations: FunctionDeclarationNode[]
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
		this.propertyDeclarations.forEach(decl => {
			decl.setState({
				...state,
				parent: this,
				isDead: false,
				isLast:
					decl ===
					this.propertyDeclarations[this.propertyDeclarations.length - 1],
			});
		});
		this.methodDeclarations.forEach(decl => {
			decl.setState({
				...state,
				parent: this,
				isDead: false,
				isLast:
					decl === this.methodDeclarations[this.methodDeclarations.length - 1],
			});
		});
	}

	public type(env: Environment): Type {
		// TODO: Look up model type stub created for us
		// Instead of creating a new model type instance, we should find the cached
		// one in the environment and set the types of the parameters, properties,
		// and methods on it
		const modelType = env.models.get(this.name);

		if (!modelType) {
			throw new Error(`Cannot find model for \`${this.name}\``);
		}

		// Convert parameters to a record type
		const parametersType = new RecordType(
			new LinkedHashMap(this.initParams.map(info => [info.name, info.type!]))
		);

		// Examine the child variable declaration nodes to determine our
		// property types
		const propertyTypes: Map<string, Type> = new Map();
		for (const decl of this.propertyDeclarations) {
			const propertyType = decl.type(env);
			const propertyName = decl.variableName;
			propertyTypes.set(propertyName, propertyType);
		}

		const methodTypes: FunctionType[] = [];
		for (const decl of this.methodDeclarations) {
			const methodType = decl.type(env) as FunctionType;
			methodType.receiverType = modelType;
			methodTypes.push(methodType);
		}

		modelType.parameters = parametersType;
		modelType.properties = propertyTypes;
		modelType.functions = methodTypes;

		return modelType;
	}

	public accept(visitor: Visitor): void {
		visitor.visitModelNode?.(this);
	}
}
