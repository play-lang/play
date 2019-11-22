import { Statement } from "../../language/node";
import { Visitor } from "../../language/visitor";
import { BlockStatementNode } from "./block-statement-node";

export class ActionDeclarationNode extends Statement {
	/** Name of the action */
	public readonly name: string;
	/** Type of the action */
	public readonly typeAnnotation: string[];
	/** Statements inside the action */
	public block: BlockStatementNode | undefined;
	/** Number of parameters expected by this action */
	public readonly numParameters: number = 0;
	/** Parameter names mapped to parameter type annotations */
	public readonly parameters: Map<string, string[]> = new Map();

	constructor(
		name: string,
		typeAnnotation: string[],
		numParameters: number,
		parameters: Map<string, string[]>
	) {
		super();
		this.name = name;
		this.typeAnnotation = typeAnnotation;
		this.numParameters = numParameters;
		this.parameters = parameters;
	}

	public accept(visitor: Visitor): void {
		visitor.visitActionDeclarationNode(this);
	}
}
