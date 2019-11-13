import { Token, Describable } from "./token";
import { LinkedHashMap } from "../common/linked-hash-map";

/** Represents an entry in a symbol table */
export class IdentifierSymbol {
	/** Token for the identifier (to keep track of where it was first declared) */
	public token: Token;
	/** Type annotation of the identifier */
	public typeAnnotation: string[];
	constructor(token: Token, typeAnnotation: string[]) {
		this.token = token;
		this.typeAnnotation = typeAnnotation;
	}
}

export default class SymbolTable implements Describable {
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

	constructor(enclosingScope?: SymbolTable) {
		this.enclosingScope = enclosingScope;
	}

	/**
	 * Reset the number of available entries for this scope and all of its
	 * child scopes
	 */
	public resetAvailable(): void {
		this.available = -1;
		for (const scope of this.scopes) {
			scope.resetAvailable();
		}
	}

	/**
	 * Returns true if the specified identifier is in the receiver's scope or any
	 * of its ancestors
	 *
	 * @param id The identifier to check
	 */
	public idInScope(id: string): boolean {
		if (
			this.entries.get(id) instanceof IdentifierSymbol &&
			this.entries.ordinal(id)! < this.available
		) {
			return true;
		}
		if (!this.enclosingScope) return false;
		// Tail recursion lookup
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
	public register(token: Token, typeAnnotation: string[]): boolean {
		// Make sure identifier doesn't already exist in this exact scope
		// Note that the identifier can exist in ancestor scopes because we allow
		// variable shadowing to happen when a nested scope uses the same
		// variable name as an outer scope
		const key = token.lexeme;
		if (this.entries.get(key)) return false;
		this.entries.set(key, new IdentifierSymbol(token, typeAnnotation));
		this.available++;
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
	 * Add a new child scope
	 *
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
			result +=
				'"Id(' +
				String(index) +
				", `" +
				entry.token.lexeme +
				"`, `" +
				entry.typeAnnotation.join(" ") +
				'`)"' +
				comma;
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
