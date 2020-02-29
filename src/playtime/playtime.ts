import { CompiledProgram } from "src/compiler/compiled-program";
import { Compiler } from "src/compiler/compiler";
import { AbstractSyntaxTree } from "src/language/abstract-syntax-tree";
import { SourceFile } from "src/language/source-file";
import { TokenLike } from "src/language/token";
import { Lexer } from "src/lexer/lexer";
import { LinkedProgram } from "src/linker/linked-program";
import { Linker } from "src/linker/linker";
import { Parser } from "src/parser/parser";
import { TypeChecker } from "src/type-checker/type-checker";

/**
 * Represents initialization options for creating a playtime engine to
 * perform Play language functions
 */
export interface PlaytimeOptions {
	/* Source code module entry point file */
	file: SourceFile;
	/**
	 * Function to call to resolve a file path referenced in a source file
	 * This function should return the fully qualified absolute file path
	 * for a file relative to the entry point file specified in this command
	 *
	 * e.g., should produce a mapping like so:
	 *
	 * -  `"./file.play" => "/user/me/folders/here/file.play"`
	 * - `"/usr/me/folders/here/file.play" => "/usr/me/folders/here/file.play"`
	 *
	 * Should return a blank string if the file path is invalid
	 */
	filePathResolver?(path: string): Promise<string>;
	/**
	 * Function to call when the contents of another file are needed
	 *
	 * The fully qualified absolute file path returned from the
	 * filePathResolver will be given to this function as the path to fetch
	 */
	fileProvider?(path: string): Promise<string>;
}

/**
 * The Playtime engine contains the core features of the Play language and
 * provides a platform-independent API to access language features such as
 * scanning, parsing, type checking, compilation, and linking
 */
export class Playtime {
	public readonly lexer: Lexer;
	public readonly parser: Parser;

	private _tokens: TokenLike[] | undefined;
	private _ast: AbstractSyntaxTree | undefined;
	private _compiledProgram: CompiledProgram | undefined;
	private _linkedProgram: LinkedProgram | undefined;

	constructor(
		/** Initialization options */
		public readonly options: PlaytimeOptions
	) {
		this.lexer = new Lexer(options.file);
		this.parser = new Parser(options.file);
	}

	/** All the tokens contained in the module entry point file */
	public get tokens(): TokenLike[] {
		if (!this._tokens) {
			this._tokens = this.lexer.readAll();
		}
		return this._tokens;
	}

	/** The abstract syntax tree represented by the module entry point file */
	public get unverifiedAst(): AbstractSyntaxTree {
		if (!this._ast) {
			this._ast = this.parser.parse();
		}
		return this._ast;
	}

	/** Type-checked abstract syntax tree */
	public get ast(): AbstractSyntaxTree {
		const ast = this.unverifiedAst;
		if (!ast.verified) {
			const typeChecker = new TypeChecker(ast);
			typeChecker.check();
		}
		return ast;
	}

	/** Compiled program */
	public get compiledProgram(): CompiledProgram {
		if (!this._compiledProgram) {
			const compiler = new Compiler(this.ast);
			this._compiledProgram = compiler.compile();
		}
		return this._compiledProgram;
	}

	/** Linked program */
	public get linkedProgram(): LinkedProgram {
		if (!this._linkedProgram) {
			const linker = new Linker();
			this._linkedProgram = linker.link(this.compiledProgram);
		}
		return this._linkedProgram;
	}
}
