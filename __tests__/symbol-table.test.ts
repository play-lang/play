import { SourceFile } from "../src/language/source-file";
import SymbolTable from "../src/language/symbol-table";
import { Token } from "../src/language/token";
import { VariableDeclarationNode } from "../src/parser/nodes/variable-declaration-node";

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
		globalScope.register(new VariableDeclarationNode(0, 0, t1, ["num"], false));
		expect(globalScope.entries.has(t1.lexeme));
		globalScope.register(new VariableDeclarationNode(0, 0, t2, ["str"], false));
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
		s1.register(new VariableDeclarationNode(0, 0, t3, ["num"], false));
		s1.register(new VariableDeclarationNode(0, 0, t4, ["str"], false));
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
		s2.register(new VariableDeclarationNode(0, 0, t5, ["num"], false));
	});
	test("should perform lookups", () => {
		expect(JSON.parse(JSON.stringify(globalScope.lookup("a")))).toEqual({
			isImmutable: false,
			end: 0,
			start: 0,
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
		expect(
			globalScope.register(
				new VariableDeclarationNode(0, 0, t1, ["num"], false)
			)
		).toBe(false);
	});
});
