import { IdentifierSymbol } from "../src/language/identifier-symbol";
import { SourceFile } from "../src/language/source-file";
import { SymbolTable } from "../src/language/symbol-table";
import { Token, TokenLike } from "../src/language/token";

let pos: number = 0;
let end: number = 1;
const chars: string[] = ["a", "b", "c", "d", "e", "f", "g"];
function fakeToken(): Token {
	return new Token({
		file: new SourceFile("test.play"),
		type: 1,
		pos,
		end: end++,
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
	test("should initialize", () => {
		expect(globalScope).toBeInstanceOf(SymbolTable);
	});
	test("should register ids", () => {
		const t2 = fakeToken(); // b
		globalScope.register(makeIdSymbol(t1, false, ["num"]));
		expect(globalScope.entries.has(t1.lexeme));
		globalScope.register(makeIdSymbol(t2, false, ["str"]));
		expect(globalScope.entries.has(t2.lexeme));
		expect(globalScope.description).toEqual(
			'{ "ids": ["Id(0, `a`, `num`)", "Id(1, `b`, `str`)"]}'
		);
	});
	test("should recognize ids in immediate scope", () => {
		expect(globalScope.idInScope("a")).toBeTruthy();
		expect(globalScope.idInScope("b")).toBeTruthy();
	});
	test("should recognize ids in enclosing scopes", () => {
		s1 = globalScope.addScope();
		const t3 = fakeToken(); // c
		const t4 = fakeToken(); // d
		s1.register(makeIdSymbol(t3, false, ["num"]));
		s1.register(makeIdSymbol(t4, false, ["str"]));
		expect(s1.idInScope("a")).toBeTruthy();
		expect(s1.idInScope("b")).toBeTruthy();
		expect(s1.idInScope("e")).toBeFalsy();
		expect(globalScope.description).toEqual(
			'{ "ids": ["Id(0, `a`, `num`)", "Id(1, `b`, `str`)"], "scopes": [{ "ids": ["Id(0, `c`, `num`)", "Id(1, `d`, `str`)"]}]}'
		);
		const s2 = globalScope.addScope();
		expect(globalScope.description).toEqual(
			'{ "ids": ["Id(0, `a`, `num`)", "Id(1, `b`, `str`)"], "scopes": [{ "ids": ["Id(0, `c`, `num`)", "Id(1, `d`, `str`)"]}, { "ids": []}]}'
		);
		const t5 = fakeToken(); // e
		s2.register(makeIdSymbol(t5, false, ["num"]));
	});
	test("should perform lookups", () => {
		expect(JSON.parse(JSON.stringify(globalScope.lookup("a")))).toEqual({
			isImmutable: false,
			name: "a",
			token: {
				column: 0,
				file: {
					path: "test.play",
				},
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
	test("should prevent duplicate id's from being registered", () => {
		expect(globalScope.register(makeIdSymbol(t1, false, ["num"]))).toBe(false);
	});
});

function makeIdSymbol(
	token: TokenLike,
	isImmutable: boolean,
	typeAnnotation: string[]
): IdentifierSymbol {
	return {
		name: token.lexeme,
		token,
		typeAnnotation,
		isImmutable,
	};
}
