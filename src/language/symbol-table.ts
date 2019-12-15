import { LinkedHashMap } from "../common/linked-hash-map";
import { IdentifierSymbol } from "./identifier-symbol";
import { Describable } from "./token";

export class SymbolTable implements Describable {
	/** Parent scope, if any */
	public readonly enclosingScope: SymbolTable | undefined;

	/** Child scopes */
	public readonly scopes: SymbolTable[] = [];

	/**
	 * Number of entries "available" to be considered in-scope
	 *
	 * As the symbol table is visited, the available entries is incremented each
	 * time an identifier is seen rather than re-registering or building a new
	 * symbol table
	 *
	 * The number of available entries are used to determine if an identifier is
	 * in scope in an enclosing scope as the enclosing scope could have declared
	 * the identifier *after* the nested scope
	 */
	public available: number = 0;

	/**
	 * Maps identifier and scope id's to their respective IdentifierSymbols and
	 * Scopes
	 */
	public entries: LinkedHashMap<string, IdentifierSymbol> = new LinkedHashMap();

	/**
	 * True if this symbol table is the global symbol table containing
	 * all other symbol tables
	 */
	public get isGlobalScope(): boolean {
		return !this.enclosingScope;
	}

	/** Number of entries in this scope */
	public get totalEntries(): number {
		return this.entries.size;
	}

	constructor(enclosingScope?: SymbolTable) {
		this.enclosingScope = enclosingScope;
	}

	/**
	 * Returns true if the specified identifier is in the receiver's scope or any
	 * of its ancestors
	 *
	 * @param id The identifier to check
	 */
	public idInScope(id: string): SymbolTable | undefined {
		if (this.entries.has(id) && this.entries.ordinal(id)! < this.available) {
			return this;
		}
		if (!this.enclosingScope) return;
		// Tail recursion search
		return this.enclosingScope.idInScope(id);
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
	 * @param token The token containing the identifier to register
	 * @param typeAnnotation The type annotation of the identifier
	 */
	public register(variableDeclaration: IdentifierSymbol): boolean {
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
	 * Searches the symbol table and all of its ancestors for an identifier string
	 * @param id The identifier to look up
	 * @returns The corresponding identifier entry if the identifier was found
	 */
	public lookup(id: string): IdentifierSymbol | undefined {
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
	 * Add a new child scope
	 * for it
	 * @returns The new scope
	 */
	public addScope(): SymbolTable {
		const scope = new SymbolTable(this);
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
