import { Parser } from "../src/parser/parser";
import { PrintVisitor } from "../src/visitors/print-visitor";

describe("print-visitor", () => {
	it("should pass basic sanity test", () => {
		const parser = new Parser(
			"test.play",
			'{ let x: num = 10 += ((1 ? 2 : 3)) ? 4 : 5 = 6\nlet myString: str = "hello"\n }'
		);
		const ast = parser.parse();
		const printer = new PrintVisitor(ast.root);
		console.log(printer.print());
		// expect(output).toEqual(
		// 	"Program\n" +
		// 		"  ├── DeclarationNode(`myNumber`, num)\n" +
		// 		"    └── ValueNode(`100`, num)\n" +
		// 		"  └── ValueNode(`100`, num)\n"
		// );
	});
});
