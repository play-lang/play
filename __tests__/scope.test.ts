import { IdentifierSymbol } from "../src/language/identifier-symbol";
import { Scope } from "../src/language/scope";
import { SourceFile } from "../src/language/source-file";
import { Token, TokenLike } from "../src/language/token";
import { Play } from "../src/play";

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
	const globalScope = new Scope();
	let s1: Scope;
	const t1 = fakeToken(); // a
	test("should initialize", () => {
		expect(globalScope).toBeInstanceOf(Scope);
	});
	test("should register ids", () => {
		const t2 = fakeToken(); // b
		globalScope.register(makeIdSymbol(t1, false));
		expect(globalScope.entries.has(t1.lexeme));
		globalScope.register(makeIdSymbol(t2, false));
		expect(globalScope.entries.has(t2.lexeme));
		expect(globalScope.description).toEqual(
			'{ "ids": ["Id(0, `a`)", "Id(1, `b`)"]}'
		);
	});
	test("should recognize ids in immediate scope", () => {
		expect(globalScope.findScope("a")).toBeTruthy();
		expect(globalScope.findScope("b")).toBeTruthy();
	});
	test("should recognize ids in enclosing scopes", () => {
		s1 = globalScope.addScope();
		const t3 = fakeToken(); // c
		const t4 = fakeToken(); // d
		s1.register(makeIdSymbol(t3, false));
		s1.register(makeIdSymbol(t4, false));
		expect(s1.findScope("a")).toBeTruthy();
		expect(s1.findScope("b")).toBeTruthy();
		expect(s1.findScope("e")).toBeFalsy();
		expect(globalScope.description).toEqual(
			'{ "ids": ["Id(0, `a`)", "Id(1, `b`)"], "scopes": [{ "ids": ["Id(0, `c`)", "Id(1, `d`)"]}]}'
		);
		const s2 = globalScope.addScope();
		expect(globalScope.description).toEqual(
			'{ "ids": ["Id(0, `a`)", "Id(1, `b`)"], "scopes": [{ "ids": ["Id(0, `c`)", "Id(1, `d`)"]}, { "ids": []}]}'
		);
		const t5 = fakeToken(); // e
		s2.register(makeIdSymbol(t5, false));
	});
	test("should perform simple lookups", () => {
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
		});
		const scope = globalScope.scopes[0];
		expect(scope.lookup("c")).toBeTruthy();
		expect(scope.lookup("x")).toBeUndefined();
	});
	test("should prevent duplicate id's from being registered", () => {
		expect(globalScope.register(makeIdSymbol(t1, false))).toBe(false);
	});
	test("global scope recognition", () => {
		const scope = globalScope.scopes[0];
		expect(globalScope.isGlobalScope).toBe(true);
		expect(globalScope.totalEntries).toBe(2);
		expect(scope.isGlobalScope).toBe(false);
		expect(scope.totalEntries).toBe(2);
	});
	test("stack position of scoped variables", () => {
		const scope = globalScope.scopes[0];
		const innerScope = scope.addScope();
		const t6 = fakeToken(); // f
		const t7 = fakeToken(); // g
		innerScope.register(makeIdSymbol(t6, false));
		innerScope.register(makeIdSymbol(t7, false));
		// Vars in global scope
		expect(scope.stackPos("a")).toBe(0);
		expect(scope.stackPos("b")).toBe(1);
		// Vars in a function scope reset back to 0 since their stack
		// position represents an offset from the function call frame
		// base pointer position
		expect(scope.stackPos("c")).toBe(0);
		expect(scope.stackPos("d")).toBe(1);
		expect(innerScope.stackPos("f")).toBe(2);
		expect(innerScope.stackPos("g")).toBe(3);
		expect(globalScope.stackPos("x")).toBeUndefined();
	});
});

describe("block scope", () => {
	test("should know about deeply nested block-scoped variables", async () => {
		const code = `
function deepNest(a: num): num {
	var b: num = a
	{
		let c: num = a
		{
			// return
			let d: num = c * 2
			// return
			b = d
		}
	}
	// Return from here should pop a, b, c, d
	return b
}
return deepNest(20)
		`;
		expect(Play.run(code).value.value).toEqual(40);
	});
});

function makeIdSymbol(
	token: TokenLike,
	isImmutable: boolean
): IdentifierSymbol {
	return new IdentifierSymbol(token.lexeme, token, isImmutable);
}
