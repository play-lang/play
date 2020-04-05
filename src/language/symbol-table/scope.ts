import { Describable } from "src/common/describable";
import { LinkedHashMap } from "src/common/linked-hash-map";
import { SymbolEntry } from "src/language/symbol-table/symbol-entry";

/**
 * Represents a scope node, a recursive data type that helps represent a tree
 * of lexical scopes declared in code.
 *
 * Each contains registered identifier symbols
 */
export class Scope implements Describable {
	/** Parent scope, if any */
	public readonly enclosingScope: Scope | undefined;

	/** Array of child scopes */
	public readonly scopes: Scope[] = [];

	/**
	 * Number of entries "available" to be considered in-scope
	 *
	 * As the scopes are visited, the available entries is incremented each
	 * time an identifier is seen
	 *
	 * The number of available entries are used to determine if an identifier is
	 * in scope in an enclosing scope as the enclosing scope could have declared
	 * the identifier *after* the nested scope
	 */
	public available: number = 0;

	/**
	 * Maps identifier names to their respective IdentifierSymbols
	 *
	 * A LinkedHashMap is used to maintain insertion order
	 */
	public entries: LinkedHashMap<string, SymbolEntry> = new LinkedHashMap();

	/**
	 * True if this scope is the global scope containing all other scopes
	 */
	public get isGlobalScope(): boolean {
		// If we have no enclosing scope we must be the global scope
		return !this.enclosingScope;
	}

	/** Number of entries in this scope */
	public get totalEntries(): number {
		return this.entries.size;
	}

	constructor(enclosingScope?: Scope) {
		this.enclosingScope = enclosingScope;
	}

	/**
	 * Returns the scope of an identifier if it is found in the current scope or
	 * an ancestor of the current scope
	 *
	 * O(log n) time complexity
	 *
	 * @param id The identifier to check
	 */
	public findScope(id: string): Scope | undefined {
		if (this.entries.has(id) && this.entries.ordinal(id)! < this.available) {
			return this;
		}
		if (!this.enclosingScope) return;
		// Tail recursion search
		return this.enclosingScope.findScope(id);
	}

	/**
	 * Registers the specified token and type as an identifier using the
	 * token's lexeme
	 *
	 * Identifier names in nested scopes are permitted to shadow the same
	 * identifier names in use in any outer scopes
	 *
	 * Returns true if the identifier was uniquely registered to the
	 * scope represented by the receiver, or false if the identifier has
	 * already been registered in this scope
	 *
	 * O(1) time complexity
	 *
	 * @param token The token containing the identifier to register
	 * @param typeAnnotation The type annotation of the identifier
	 */
	public register(variableDeclaration: SymbolEntry): boolean {
		// Make sure identifier doesn't already exist in this exact scope
		// Note that the identifier can exist in ancestor scopes because we allow
		// variable shadowing to happen when a nested scope uses the same
		// variable name as an outer scope
		const key = variableDeclaration.name;
		if (this.entries.get(key)) return false;
		this.entries.set(key, variableDeclaration);
		this.available++;
		return true;
	}

	/**
	 * Searches the scope and all of its ancestor scopes for an identifier string
	 *
	 * O(log n) time complexity
	 *
	 * @param id The identifier to look up
	 * @returns The corresponding identifier entry if the identifier was found
	 */
	public lookup(id: string): SymbolEntry | undefined {
		if (this.entries.has(id) && this.entries.ordinal(id)! < this.available) {
			return this.entries.get(id);
		}
		if (!this.enclosingScope) return;
		// Tail recursion lookup
		return this.enclosingScope.lookup(id);
	}

	/**
	 * Returns the stack position of the specified local variable for this scope
	 *
	 * Stack position does not include any offsets from variables in the global
	 * scope
	 *
	 * This allows the VM to use the stack pos as an offset from the current
	 * call frame
	 *
	 * Essentially, stack pos represents the position of the variable on the
	 * stack relative to the current function
	 *
	 * O(log n) time complexity
	 *
	 * @param id The variable name to look up
	 */
	public stackPos(id: string): number | undefined {
		if (this.entries.has(id) && this.entries.ordinal(id)! < this.available) {
			let scope = this.enclosingScope;
			let stackPos = 0;
			while (scope && !scope.isGlobalScope) {
				// While there's a scope above us that ISN'T the global scope...
				stackPos += scope.available;
				scope = scope.enclosingScope;
			}
			return this.entries.ordinal(id)! + stackPos;
		}
		if (!this.enclosingScope) return;
		// Tail recursion lookup
		return this.enclosingScope.stackPos(id);
	}

	/**
	 * Add a new child scope to this scope
	 * @returns The new scope
	 */
	public addScope(): Scope {
		const scope = new Scope(this);
		this.scopes.push(scope);
		return scope;
	}

	/** String description of the scope tree */
	public get description(): string {
		return this._description();
	}

	protected _description(indent: number = 0): string {
		// Converts scope table to very concise json for testing
		const entries = Array.from(this.entries.values());
		let result = "";
		result += '{ "ids": [';
		entries.forEach((entry, index) => {
			const comma = index + 1 === entries.length ? "" : ", ";
			result += '"Id(' + String(index) + ", `" + entry.name + '`)"' + comma;
		});
		result += "]" + (this.scopes.length > 0 ? ', "scopes": [' : "");
		for (const [index, scope] of this.scopes.entries()) {
			result += scope._description(indent + 1);
			if (index + 1 !== this.scopes.length) result += ", ";
		}
		if (this.scopes.length > 0) result += "]";
		result += "}";
		return result.trim();
	}
}
