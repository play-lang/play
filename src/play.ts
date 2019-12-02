import { CompiledProgram } from "./compiler/compiled-program";
import { Compiler } from "./compiler/compiler";
import { Disassembler } from "./disassembler/disassembler";
import { AbstractSyntaxTree } from "./language/abstract-syntax-tree";
import { TokenLike } from "./language/token";
import { Lexer } from "./lexer/lexer";
import { LinkedProgram } from "./linker/linked-program";
import { Linker } from "./linker/linker";
import { Parser } from "./parser/parser";
import { JSONVisitor } from "./visitors/json-visitor";
import { PrintVisitor } from "./visitors/print-visitor";
import { VirtualMachine } from "./vm/virtual-machine";
import { VMResult } from "./vm/vm-result";

/**
 * Play programming language
 *
 * Provides static methods for easy execution
 */
export class Play {
	/**
	 *  Scans the specified string of code
	 * @param code The code to scan
	 * @returns The list of tokens
	 */
	public static scan(code: string): TokenLike[] {
		const lexer = new Lexer(code);
		return lexer.readAll();
	}

	/**
	 * Converts the specified code into an abstract syntax tree
	 * @param code The code to parse
	 * @returns The abstract syntax tree
	 */
	public static parse(code: string): AbstractSyntaxTree {
		const parser = new Parser(code);
		const ast = parser.parse();
		if (parser.errors.length > 0) {
			console.error(parser.errors);
			throw new Error("Parsing failed");
		}
		return ast;
	}

	/**
	 * Compiles the specified program
	 * @param code The code to compile
	 * @returns The compiled program object
	 */
	public static compile(code: string): CompiledProgram {
		const ast = Play.parse(code);
		const compiler = new Compiler(ast);
		return compiler.compile();
	}

	/**
	 * Links the compiled program together and resolves addresses in the final
	 * bytecode
	 * @param code The code to link
	 * @returns The linked program object
	 */
	public static link(code: string): LinkedProgram {
		const compiledProgram = Play.compile(code);
		const linker = new Linker(compiledProgram);
		return linker.link();
	}

	/**
	 * Runs the specified code
	 * @param code The code to run
	 * @returns The virtual machine result containing a status and final value
	 * (from the top of the stack)
	 */
	public static run(code: string): VMResult {
		const linkedProgram = Play.link(code);
		const vm = new VirtualMachine(linkedProgram.program);
		return vm.run();
	}

	/**
	 * "Disassembles" the specified code by describing the compiled instructions
	 * and constant pool into a more friendly string representation
	 * @param code The code to disassemble
	 * @returns The string describing the compiled instructions and constant pool
	 */
	public static disassemble(code: string): string {
		const loadedProgram = this.link(code).program;
		const disassembler = new Disassembler(loadedProgram);
		return disassembler.disassemble();
	}

	/**
	 * Describes the abstract syntax tree for the specified code as
	 * a human-friendly tree representation string for convenient
	 * console output
	 * @param code The code to describe
	 */
	public static describeAst(code: string): string {
		const ast = Play.parse(code);
		const printer = new PrintVisitor(ast);
		return printer.print();
	}

	/**
	 * Describes the abstract syntax tree for the specified code as a
	 * machine-friendly JSON object representation for convenient automated
	 * testing and analysis
	 *
	 * This ensures the resulting object is a tree, rather than a graph with back
	 * edges which could cause cycles
	 * @param code The code to describe
	 * @returns The JSON object, stringified
	 */
	public static describeAstAsJSON(code: string): object {
		const ast = Play.parse(code);
		const printer = new JSONVisitor(ast);
		return printer.json();
	}
}
