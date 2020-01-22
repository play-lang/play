import { Scope } from "./scope";

export class SymbolTable {
	private _scope: Scope;

	/** Index of the next child scope to visit for each scope level */
	private childScopeIndices: number[] = [0];
	/** Number of scopes deep we are--used as an index to childScopeIndices */
	private scopeDepth: number = 0;

	/** Current scope */
	public get scope(): Scope {
		return this._scope;
	}

	constructor(
		/** Global scope */
		public readonly globalScope: Scope
	) {
		this._scope = globalScope;
	}

	/** Enter the next child scope */
	public enterScope(): void {
		const childScopeIndex = this.childScopeIndices[this.scopeDepth++]++;
		this.childScopeIndices.push(0);
		this._scope = this.scope.scopes[childScopeIndex];
	}

	/** Go back to the parent scope */
	public exitScope(): void {
		this.scopeDepth--;
		this.childScopeIndices.pop();
		this._scope = this.scope.enclosingScope || this.globalScope;
	}

	/**
	 * Reset the symbol table's current scope and position within the scope tree
	 */
	public reset(): void {
		this._scope = this.globalScope;
		this.scopeDepth = 0;
		this.childScopeIndices = [0];
	}
}
