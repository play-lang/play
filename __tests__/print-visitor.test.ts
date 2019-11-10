import { Parser } from "../src/parser/parser";
import { PrintVisitor } from "../src/visitors/print-visitor";

describe("print-visitor", () => {
	it("should pass basic sanity test", () => {
		const parser = new Parser(
			"test.play",
			'num x = 10 += ((1 ? 2 : 3)) ? 4 : 5 = 6\nstr myString = "hello"\n'
			// "num myNumber = 100 * 100 + - 100 ^ 3 - (3+3)\n"
		);
		const ast = parser.parse();
		const printVisitor = new PrintVisitor();
		ast.accept(printVisitor);
		const output = printVisitor.description;
		console.log(output);
		// expect(output).toEqual(
		// 	"Program\n" +
		// 		"  ├── DeclarationNode(`myNumber`, num)\n" +
		// 		"    └── ValueNode(`100`, num)\n" +
		// 		"  └── ValueNode(`100`, num)\n"
		// );
	});
});
