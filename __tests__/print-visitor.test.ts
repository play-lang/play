import { Parser } from "../src/parser/parser";
import { PrintVisitor } from "../src/parser/visitor/print-visitor";
describe("print-visitor", () => {
	it("should work", () => {
		const parser = new Parser("test.play", "num myNumber = 100");
		const ast = parser.parse();
		const printVisitor = new PrintVisitor();
		ast.accept(printVisitor);
		const output = printVisitor.description;
		console.log(output);
	});
});
