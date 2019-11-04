import { Parser } from "../src/parser/parser";
import { PrintVisitor } from "../src/visitors/print-visitor";

describe("print-visitor", () => {
	it("should pass basic sanity test", () => {
		const parser = new Parser("test.play", "num myNumber = 100");
		const ast = parser.parse();
		const printVisitor = new PrintVisitor();
		ast.accept(printVisitor);
		const output = printVisitor.description;
		expect(output).toEqual(
			"Program\n  └── VariableNode(`myNumber`, num)\n    └── ValueNode(`100`, num)\n"
		);
	});
});
