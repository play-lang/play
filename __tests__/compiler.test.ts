import { Parser } from "../src/parser/parser";
import { Compiler } from "../src/compiler/compiler";
import { Disassembler } from "../src/vm/disassembler/disassembler";
import { PrintVisitor } from "../src/visitors/print-visitor";
import { VirtualMachine } from "../src/vm/virtual-machine";
import { VMResult } from "../src/vm/vm-result";

describe("compiler", () => {
	it("should work", () => {
		const parser = new Parser("test.play", "1 + 2 * 3 ^ -4 / 5 % 6");
		const ast = parser.parse();
		const printer = new PrintVisitor(ast);
		console.log(printer.print());
		const compiler = new Compiler(ast);
		compiler.compile();
		const disassembler = new Disassembler();
		const code = disassembler.disassemble(compiler.context);
		console.log(code);
		const vm = new VirtualMachine(compiler.context);
		const result = vm.run();
		console.log("Execution finished with", VMResult[result], "status");
	});
});
