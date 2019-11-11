import { Expression } from "../../language/node";
import { Visitor } from "../../language/visitor";

export class LiteralNode extends Expression {
	/** Program statements */
	public readonly value: string;
	public readonly typeAnnotation: string[];

	constructor(value: string, typeAnnotation: string[]) {
		super();
		this.value = value;
		this.typeAnnotation = typeAnnotation;
	}

	public accept(visitor: Visitor): void {
		visitor.visitLiteralNode(this);
	}
}
