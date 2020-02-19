import { CompiledProgram } from "src/compiler/compiled-program";
import { Compiler } from "src/compiler/compiler";
import { Disassembler } from "src/disassembler/disassembler";
import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { SemanticError } from "src/language/semantic-error";
import { TokenLike } from "src/language/token";
import { Lexer } from "src/lexer/lexer";
import { LinkedProgram } from "src/linker/linked-program";
import { Linker } from "src/linker/linker";
import { Parser } from "src/parser/parser";
import { TypeChecker } from "src/type-checker/type-checker";
import { JSONVisitor } from "src/visitors/json-visitor";
import { PrintVisitor } from "src/visitors/print-visitor";
import { VirtualMachine } from "src/vm/virtual-machine";
import { VMResult } from "src/vm/vm-result";

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
	 * Check the specified code string for errors
	 * @param code The code to check
	 */
	public static check(code: string): SemanticError[] {
		const ast = Play.parse(code);
		const typeChecker = new TypeChecker(ast);
		typeChecker.check();
		return typeChecker.errors;
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
		const program = Play.compile(code);
		const linker = new Linker();
		return linker.link(program);
	}

	/**
	 * Runs the specified code
	 * @param code The code to run
	 * @returns The virtual machine result containing a status and final value
	 * (from the top of the stack)
	 */
	public static run(code: string): VMResult {
		const linkedProgram = Play.link(code);
		const errors = Play.check(code);
		if (errors.length > 0) {
			console.error(errors);
			throw new Error("Type checking failed");
		}
		const vm = new VirtualMachine(linkedProgram.program);
		return vm.run();
	}

	/**
	 * Disassembles the specified code by describing the compiled instructions
	 * and constant pool in a more human-friendly string representation
	 * @param code The code to disassemble
	 * @returns The string describing the compiled instructions and constant pool
	 */
	public static disassemble(code: string): string {
		const program = this.compile(code);
		const disassembler = new Disassembler();
		return disassembler.disassemble(program);
	}

	/**
	 * Disassembles the specified code by describing the compiled, linked
	 * instructions and constant pool in a more human-friendly string
	 * representation
	 * @param code The code to disassemble
	 * @returns The string describing the compiled instructions and constant pool
	 */
	public static disassembleFinal(code: string): string {
		const program = this.link(code);
		const disassembler = new Disassembler();
		return disassembler.disassemble(program);
	}

	/**
	 * Describes the abstract syntax tree for the specified code as
	 * a human-friendly tree representation string for convenient
	 * console output
	 * @param code The code to describe
	 */
	public static describeAst(code: string): string {
		const ast = Play.parse(code);
		const typeChecker = new TypeChecker(ast);
		if (!typeChecker.check()) {
			throw new Error("Type check failed:\n" + typeChecker.errors.join("\n"));
		}

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
