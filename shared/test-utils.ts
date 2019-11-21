import { Compiler } from "../src/compiler/compiler";
import { Disassembler } from "../src/disassembler/disassembler";
import { Linker } from "../src/linker/linker";
import { Parser } from "../src/parser/parser";
import { PrintVisitor } from "../src/visitors/print-visitor";
import { VirtualMachine } from "../src/vm/virtual-machine";
import { VMStatus } from "../src/vm/vm-status";

/**
 * Runs the specified code in the Play VM
 * @param code The code to run
 * @param verbose If true, prints debugging output
 */
export function run(code: string, verbose: boolean = false): any {
	const parser = new Parser("test.play", code);
	const ast = parser.parse();
	const printer = new PrintVisitor(ast.root);
	if (verbose) console.log(printer.print());
	const compiler = new Compiler(ast);
	compiler.compile();
	const disassembler = new Disassembler();
	const deconstruction = disassembler.disassemble(compiler.context);
	if (verbose) console.log(deconstruction);
	if (verbose) console.log("Code:\t", code);
	const vm = new VirtualMachine(compiler.context);
	const result = vm.run();
	if (verbose) console.log("Execution finished:\t", VMStatus[result.status]);
	return result.value.value;
}

/**
 * Describes the AST for the specified code
 * @param code The code to parse
 */
export function describeAst(code: string): string {
	const parser = new Parser("test.play", code);
	const ast = parser.parse();
	if (parser.errors.length > 0) {
		console.error(parser.errors);
		throw new Error("Parser errors");
	}
	const printer = new PrintVisitor(ast.root);
	return printer.print();
}

/**
 * Compiles the specified code
 * @param code The code to compile
 */
export function compile(code: string): string {
	const parser = new Parser("test.play", code);
	const ast = parser.parse();
	if (parser.errors.length > 0) {
		console.error(parser.errors);
		throw new Error("Parser errors");
	}
	const compiler = new Compiler(ast);
	compiler.compile();
	const disassembler = new Disassembler();
	const deconstruction = disassembler.disassemble(compiler.context);
	return deconstruction;
}

export function compileAndLink(code: string): string {
	const parser = new Parser("test.play", code);
	const ast = parser.parse();
	if (parser.errors.length > 0) {
		console.error(parser.errors);
		throw new Error("Parser errors");
	}
	const compiler = new Compiler(ast);
	compiler.compile();
	const linker = new Linker(compiler.contexts, compiler.constantPool);
	const linkedProgram = linker.link();
	const disassembler = new Disassembler();
	const deconstruction = disassembler.disassemble(linkedProgram.program);
	return deconstruction;
}
