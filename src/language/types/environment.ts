import { FunctionInfo } from "src/language/function-info";
import { Scope } from "src/language/scope";

/**
 * Represents a type checking environment that contains the following
 * pieces of information:
 *
 * - Global scope
 * - Current scope
 * - Function table containing information about every function
 *
 * Additionally, the environment provides methods that allow the next scope
 * to be entered and exited easily to walk the scope tree.
 */
export class Environment {
	private _scope: Scope;

	/** Current scope */
	public get scope(): Scope {
		return this._scope;
	}

	/** Index of the next child scope to visit for each scope level */
	private childScopeIndices: number[] = [0];
	/** Number of scopes deep we are--used as an index to childScopeIndices */
	private scopeDepth: number = 0;

	constructor(
		/**
		 * Global scope of the type-checking environment
		 */
		public readonly globalScope: Scope,
		/** Function table of the type-checking environment */
		public readonly functionTable: Map<string, FunctionInfo>
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
}
