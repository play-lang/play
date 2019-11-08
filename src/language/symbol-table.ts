import { Token, Describable } from "./token";
import { LinkedHashMap } from "../common/linked-hash-map";

export interface SymbolTableValue {
	/** Position of the value within the owning scope */
	ordinal: number;
}

/** Represents an entry in a symbol table */
export class IdentifierSymbol implements SymbolTableValue {
	/** Token for the identifier (to keep track of where it was first declared) */
	public token: Token;
	/** Type annotation of the identifier */
	public typeAnnotation: string[];
	public readonly ordinal: number;
	constructor(token: Token, type: string[], ordinal: number) {
		this.token = token;
		this.typeAnnotation = type;
		this.ordinal = ordinal;
	}
}

export default class SymbolTable implements SymbolTableValue, Describable {
	/** Number of child scopes */
	public numScopes: number = 0;
	/** Number of identifiers */
	public numIdentifiers: number = 0;
	/** Parent scope, if any */
	public readonly parentScope: SymbolTable | null;
	/** Internal identifier for the scope name (for debugging the symbol table) */
	public readonly scopeId: string;
	public readonly ordinal: number;

	/**
	 * Maps identifier and scope id's to their respective IdentifierSymbols and
	 * Scopes
	 */
	public entries: Map<string, SymbolTableValue> = new LinkedHashMap<
		string,
		SymbolTableValue
	>();

	/** Current item in the scope tree */
	protected currentKey: string = "";

	constructor(
		scopeId: string,
		parentScope: SymbolTable | null = null,
		ordinal: number = 0
	) {
		this.scopeId = scopeId;
		this.parentScope = parentScope;
		this.ordinal = ordinal;
	}

	/**
	 * Total number of entries in the symbol table (including nested scopes and
	 * symbols)
	 */
	public get totalEntries(): number {
		return this.numScopes + this.numIdentifiers;
	}

	/**
	 * Returns true if the specified identifier is in the receiver's scope or any
	 * of its ancestors
	 *
	 * @param id The identifier to check
	 */
	public identifierInScope(id: string): boolean {
		if (this.entries.get(id) instanceof IdentifierSymbol) return true;
		let parentScope = this.parentScope;
		while (parentScope) {
			if (parentScope.identifierInScope(id)) return true;
			parentScope = parentScope.parentScope;
		}
		return false;
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
	public register(token: Token, typeAnnotation: string[]): boolean {
		// Make sure identifier doesn't already exist in this exact scope
		// Note that the identifier can exist in ancestor scopes because we allow
		// variable shadowing to happen when a nested scope uses the same
		// variable name as an outer scope
		const key = token.lexeme;
		if (this.entries.get(key)) return false;
		this.entries.set(
			key,
			new IdentifierSymbol(token, typeAnnotation, this.totalEntries)
		);
		this.numIdentifiers++;
		this.currentKey = key;
		return true;
	}

	/**
	 * Searches the receiver's symbol table for an identifier string
	 * @param id The identifier to look up
	 * @returns The corresponding identifier entry if the identifier was found
	 */
	public lookup(id: string): IdentifierSymbol | null {
		const result = this.entries.get(id);
		return result && result instanceof IdentifierSymbol ? result : null;
	}

	/**
	 * Add a new scope at the end of the symbol table
	 *
	 * @returns The new scope
	 */
	public addScope(): SymbolTable {
		// We can use an invalid identifier string for a scope key since
		// identifiers can't contain operator symbols
		this.currentKey = "SCOPE-" + String(this.numScopes);
		const scope = new SymbolTable(this.currentKey, this, this.totalEntries);
		this.entries.set(this.currentKey, scope);
		this.numScopes++;
		return scope;
	}

	/** String description of the scope tree */
	public get description(): string {
		return this._description();
	}

	protected _description(indent: number = 0): string {
		const entries = Array.from(this.entries.values()).sort(
			(a, b) => a.ordinal - b.ordinal
		);
		let result = "";
		entries.forEach(entry => {
			result += "".padStart(indent * 2, " ");
			if (entry instanceof SymbolTable) {
				result += "Scope(" + entry.scopeId + ")\n";
				result += entry._description(indent + 1);
			} else if (entry instanceof IdentifierSymbol) {
				result +=
					"Id(`" +
					entry.token.lexeme +
					"`, `" +
					entry.typeAnnotation.join(" ") +
					"`)\n";
			}
		});
		return result;
	}
}
