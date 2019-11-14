import SymbolTable from "../src/language/symbol-table";
import { Token } from "../src/language/token";

let pos: number = 0;
const chars: string[] = ["a", "b", "c", "d", "e", "f", "g"];
function fakeToken(): Token {
	return new Token({
		fileTableIndex: 0,
		trivia: [],
		type: 1,
		pos,
		line: 0,
		column: pos,
		length: 1,
		lexeme: chars[pos++ % chars.length],
	});
}

describe("symbol table", () => {
	const globalScope = new SymbolTable();
	let s1: SymbolTable;
	const t1 = fakeToken(); // a
	it("should initialize", () => {
		expect(globalScope).toBeInstanceOf(SymbolTable);
	});
	it("should register ids", () => {
		const t2 = fakeToken(); // b
		globalScope.register(t1, ["num"]);
		expect(globalScope.entries.has(t1.lexeme));
		globalScope.register(t2, ["str"]);
		expect(globalScope.entries.has(t2.lexeme));
		expect(globalScope.description).toEqual(
			'{ "ids": ["Id(0, `a`, `num`)", "Id(1, `b`, `str`)"]}'
		);
	});
	it("should recognize ids in immediate scope", () => {
		expect(globalScope.idInScope("a")).toEqual(true);
		expect(globalScope.idInScope("b")).toEqual(true);
	});
	it("should recognize ids in enclosing scopes", () => {
		s1 = globalScope.addScope();
		const t3 = fakeToken(); // c
		const t4 = fakeToken(); // d
		s1.register(t3, ["num"]);
		s1.register(t4, ["str"]);
		expect(s1.idInScope("a")).toBe(true);
		expect(s1.idInScope("b")).toBe(true);
		expect(s1.idInScope("e")).toBe(false);
		expect(globalScope.description).toEqual(
			'{ "ids": ["Id(0, `a`, `num`)", "Id(1, `b`, `str`)"], "scopes": [{ "ids": ["Id(0, `c`, `num`)", "Id(1, `d`, `str`)"]}]}'
		);
		const s2 = globalScope.addScope();
		expect(globalScope.description).toEqual(
			'{ "ids": ["Id(0, `a`, `num`)", "Id(1, `b`, `str`)"], "scopes": [{ "ids": ["Id(0, `c`, `num`)", "Id(1, `d`, `str`)"]}, { "ids": []}]}'
		);
		const t5 = fakeToken(); // e
		s2.register(t5, ["num"]);
	});
	it("should perform lookups", () => {
		expect(globalScope.lookup("a")).toEqual({
			token: {
				column: 0,
				fileTableIndex: 0,
				length: 1,
				lexeme: "a",
				line: 0,
				pos: 0,
				trivia: [],
				type: 1,
			},
			typeAnnotation: ["num"],
		});
	});
	it("should prevent duplicate id's from being registered", () => {
		expect(globalScope.register(t1, ["num"])).toBe(false);
	});
});
