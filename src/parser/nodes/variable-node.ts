import { Visitor } from "../../language/visitor";
import { Statement, Expression } from "../../language/node";

export class VariableNode extends Statement {
	/** Name of the variable */
	public readonly name: string;
	/** Type of the variable */
	public readonly typeAnnotation: string[];
	/** Value of the variable */
	public readonly expr: Expression;

	constructor(name: string, typeAnnotation: string[], expr: Expression) {
		super();
		this.name = name;
		this.typeAnnotation = typeAnnotation;
		this.expr = expr;
	}

	public accept(visitor: Visitor): void {
		visitor.visitVariableNode(this);
	}
}
