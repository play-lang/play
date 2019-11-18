import { Expression, Statement } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class VariableDeclarationNode extends Statement {
	/** Name of the variable */
	public readonly name: string;
	/** Type of the variable */
	public readonly typeAnnotation: string[];
	/** Value of the variable */
	public readonly expr: Expression | undefined;

	constructor(name: string, typeAnnotation: string[], expr?: Expression) {
		super();
		this.name = name;
		this.typeAnnotation = typeAnnotation;
		this.expr = expr;
	}

	public accept(visitor: Visitor): void {
		visitor.visitVariableDeclarationNode(this);
	}
}
