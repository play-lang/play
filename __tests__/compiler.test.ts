import { Parser } from "../src/parser/parser";
import { Compiler } from "../src/compiler/compiler";
import { Disassembler } from "../src/vm/disassembler/disassembler";
import { PrintVisitor } from "../src/visitors/print-visitor";
import { VirtualMachine } from "../src/vm/virtual-machine";
import { VMStatus } from "../src/vm/vm-status";
import { VMResult } from "../src/vm/vm-result";

describe("compiler/vm", () => {
	it("should compute expressions", () => {
		expect(run("5 + (3 - 2 ^ (-3 + 3) % 3) * 6 + 2 / 2").value.value).toBe(18);
		expect(run("10 + 11").value.value).toBe(21);
		expect(run("10 > 11").value.value).toBe(false);
	});
	it("should compute conditionals", () => {
		compile("true ? 2 : 3");
	});
});

function run(code: string, verbose: boolean = false): VMResult {
	const parser = new Parser("test.play", code);
	const ast = parser.parse();
	const printer = new PrintVisitor(ast);
	if (verbose) console.log(printer.print());
	const compiler = new Compiler(ast, parser.globalScope);
	compiler.compile();
	const disassembler = new Disassembler();
	const deconstruction = disassembler.disassemble(compiler.context);
	if (verbose) console.log(deconstruction);
	if (verbose) console.log("Code:\t", code);
	const vm = new VirtualMachine(compiler.context);
	const result = vm.run();
	if (verbose) console.log("Execution finished:\t", VMStatus[result.status]);
	return result;
}

// function printAst(code: string): void {
// 	const parser = new Parser("test.play", code);
// 	const ast = parser.parse();
// 	const printer = new PrintVisitor(ast);
// 	console.log(printer.print());
// }

function compile(code: string): void {
	const parser = new Parser("test.play", code);
	const ast = parser.parse();
	const printer = new PrintVisitor(ast);
	console.log(printer.print());
	const compiler = new Compiler(ast, parser.globalScope);
	compiler.compile();
	const disassembler = new Disassembler();
	const deconstruction = disassembler.disassemble(compiler.context);
	console.log(deconstruction);
	console.log("Code:\t", code);
}
