import { FunctionInfo } from "src/language/function-info";
import { SymbolTable } from "src/language/symbol-table";

/**
 * Represents a type checking environment that contains the following
 * pieces of information:
 *
 * - Global scope symbol table
 * - Symbol table for the current scope
 * - Function table containing information about all functions
 *
 * Additionally, the environment provides methods that allow the next scope
 * to be entered and exited easily to walk the scope tree.
 */
export class Environment {
	private _symbolTable: SymbolTable;

	/** Current symbol table for the active scope */
	public get symbolTable(): SymbolTable {
		return this._symbolTable;
	}

	/** Index of the next child scope to visit for each scope level */
	private childScopeIndices: number[] = [0];
	/** Number of scopes deep we are--used as an index to childScopeIndices */
	private scopeDepth: number = 0;

	constructor(
		/**
		 * Symbol table for use in the type-checking environment
		 *
		 * When initializing the environment, give it the global scope symbol table
		 */
		public readonly globalScope: SymbolTable,
		/** Function table for use in the type-checking environment */
		public readonly functionTable: Map<string, FunctionInfo>
	) {
		this._symbolTable = globalScope;
	}

	/** Enter the next child scope of the current symbol table */
	public enterScope(): void {
		const childScopeIndex = this.childScopeIndices[this.scopeDepth++]++;
		this.childScopeIndices.push(0);
		this._symbolTable = this.symbolTable.scopes[childScopeIndex];
	}

	/** Exit the current scope */
	public exitScope(): void {
		this.scopeDepth--;
		this.childScopeIndices.pop();
		this._symbolTable = this.symbolTable.enclosingScope || this.globalScope;
	}
}
