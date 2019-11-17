import { Parser } from "../src/parser/parser";
import { Compiler } from "../src/compiler/compiler";
import { Disassembler } from "../src/vm/disassembler/disassembler";
import { PrintVisitor } from "../src/visitors/print-visitor";
import { VirtualMachine } from "../src/vm/virtual-machine";
import { VMStatus } from "../src/vm/vm-status";
import { VMResult } from "../src/vm/vm-result";

describe("compiler/vm", () => {
	it("should compute expressions", () => {
		// Throw some math at the language:
		expect(run("5 + (3 - 2 ^ (-3 + 3) % 3) * 6 + 2 / 2").value.value).toBe(18);
		expect(run("10 + 11").value.value).toBe(21);
		expect(run("10 > 11").value.value).toBe(false);
	});
	it("should compute ternary conditional operator", () => {
		expect(run("true ? 2+3 : 4+5").value.value).toBe(5);
		expect(run("false ? 2+3 : 4+5").value.value).toBe(9);
		// Ensure that nested ternary operators evaluate correctly
		//
		// Nested on inside:
		expect(run("true ? true ? 1 : 2 : 3").value.value).toBe(1);
		expect(run("true ? false ? 1 : 2 : 3").value.value).toBe(2);
		expect(run("false ? true ? 1 : 2 : 3").value.value).toBe(3);
		// Nested on outside:
		expect(run("true ? 1 : true ? 2: 3").value.value).toBe(1);
		expect(run("false ? 1 : true ? 2: 3").value.value).toBe(2);
		expect(run("false ? 1 : false ? 2: 3").value.value).toBe(3);
	});
	it("should short-circuit logical operators", () => {
		// And
		expect(run("false and false").value.value).toBe(false);
		expect(run("false and 0").value.value).toBe(false);
		expect(run("true and true").value.value).toBe(true);
		expect(run("false and 20").value.value).toBe(false);
		expect(run("20 and 30").value.value).toBe(30);
		expect(run("0 and 30").value.value).toBe(0);
		// Or
		expect(run("0 or 1", true).value.value).toBe(1);
		expect(run("1 or 0").value.value).toBe(1);
		expect(run("true or 20").value.value).toBe(true);
		expect(run("false or true").value.value).toBe(true);
		expect(run("false or 0").value.value).toBe(0);
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

// function compile(code: string): void {
// 	const parser = new Parser("test.play", code);
// 	const ast = parser.parse();
// 	const printer = new PrintVisitor(ast);
// 	console.log(printer.print());
// 	const compiler = new Compiler(ast, parser.globalScope);
// 	compiler.compile();
// 	const disassembler = new Disassembler();
// 	const deconstruction = disassembler.disassemble(compiler.context);
// 	console.log(deconstruction);
// 	console.log("Code:\t", code);
// }
