import SymbolTable from "../src/language/symbol-table";
import { Token } from "../src/language/token";

describe("symbol table", () => {
	const globalScope = new SymbolTable("global");
	const aToken = new Token({
		fileTableIndex: 0,
		trivia: [],
		type: 1,
		pos: 0,
		line: 0,
		column: 0,
		length: 1,
		lexeme: "a",
	});
	const bToken = new Token({
		fileTableIndex: 0,
		trivia: [],
		type: 1,
		pos: 0,
		line: 0,
		column: 0,
		length: 1,
		lexeme: "b",
	});
	it("should initialize", () => {
		expect(globalScope).toBeInstanceOf(SymbolTable);
	});
	it("should add identifiers and scopes", () => {
		globalScope.register(aToken, ["num"]);
		expect(globalScope.description.trim()).toBe("Id(`a`, `num`)");
		globalScope.register(bToken, ["str"]);
		expect(globalScope.description.trim()).toBe(
			"Id(`a`, `num`)\nId(`b`, `str`)"
		);
		const nestedScope = globalScope.addScope();
		expect(globalScope.description.trim()).toBe(
			"Id(`a`, `num`)\nId(`b`, `str`)\nScope(SCOPE-0)"
		);
		const deepScope = nestedScope.addScope();
		expect(globalScope.description.trim()).toBe(
			"Id(`a`, `num`)\nId(`b`, `str`)\nScope(SCOPE-0)\n  Scope(SCOPE-0)"
		);
		deepScope.register(
			new Token({
				fileTableIndex: 0,
				trivia: [],
				type: 1,
				pos: 0,
				line: 0,
				column: 0,
				length: 1,
				lexeme: "a",
			}),
			["num"]
		);
		expect(globalScope.description.trim()).toBe(
			"Id(`a`, `num`)\nId(`b`, `str`)\nScope(SCOPE-0)\n  Scope(SCOPE-0)\n    Id(`a`, `num`)"
		);
		expect(deepScope.identifierInScope("a")).toBe(true);
		// Should also be true because it's available in the outer scope:
		expect(deepScope.identifierInScope("b")).toBe(true);
		expect(deepScope.identifierInScope("d")).toBe(false);
	});
	it("should recognize identifiers in outer scope", () => {
		expect(globalScope.identifierInScope("a")).toBe(true);
		expect(globalScope.identifierInScope("d")).toBe(false);
	});
	it("should perform lookups", () => {
		expect(globalScope.lookup("a")).toEqual({
			token: aToken,
			typeAnnotation: ["num"],
			ordinal: 0,
		});
		expect(globalScope.lookup("b")).toEqual({
			token: bToken,
			typeAnnotation: ["str"],
			ordinal: 1,
		});
		expect(globalScope.lookup("d")).toBe(null);
	});
	it("should prevent duplicate id's from being registered", () => {
		expect(globalScope.register(aToken, ["num"])).toBe(false);
		// Re-assert prior condition to make sure it still holds:
		expect(globalScope.description.trim()).toBe(
			"Id(`a`, `num`)\nId(`b`, `str`)\nScope(SCOPE-0)\n  Scope(SCOPE-0)\n    Id(`a`, `num`)"
		);
	});
});
