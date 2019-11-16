import { Parser } from "../src/parser/parser";
import { Compiler } from "../src/compiler/compiler";
import { Disassembler } from "../src/vm/disassembler/disassembler";
import { PrintVisitor } from "../src/visitors/print-visitor";
import { VirtualMachine } from "../src/vm/virtual-machine";
import { VMResult } from "../src/vm/vm-result";

describe("compiler", () => {
	it("should work", () => {
		try {
			const input = "num myNumber = 10 + 11";
			const parser = new Parser("test.play", input);
			const ast = parser.parse();
			const printer = new PrintVisitor(ast);
			console.log(printer.print());
			const compiler = new Compiler(ast, parser.globalScope);
			compiler.compile();
			const disassembler = new Disassembler();
			const code = disassembler.disassemble(compiler.context);
			console.log(code);
			console.log("Code:\t", input);
			const vm = new VirtualMachine(compiler.context);
			const result = vm.run();
			console.log("Execution finished:\t", VMResult[result]);
		} catch (e) {
			console.error(e);
			console.log("Sorry, kid");
		}
	});
});
