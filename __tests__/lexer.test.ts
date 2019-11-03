import { Lexer } from "../src/lexer";

describe("lexer", () => {
	const fileTable = ["test.play"];
	let lexer = new Lexer("10 + 20 -123.4e-56", 0, fileTable);
	it("should initialize sensibly", () => {
		expect(lexer).toBeInstanceOf(Lexer);
	});
	it("should tokenize basic numbers", () => {
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"Number(`10`)",
			"Plus(`+`)",
			"Number(`20`)",
			"Minus(`-`)",
			"Number(`123.4e-56`)",
			"EndOfFile(``)",
		]);
	});
	it("should tokenize basic id's", () => {
		lexer = new Lexer("_id1 id2 3id ++id4", 0, fileTable);
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"Id(`_id1`)",
			"Id(`id2`)",
			"Number(`3`)",
			"Id(`id`)",
			"PlusPlus(`++`)",
			"Id(`id4`)",
			"EndOfFile(``)",
		]);
	});
	it("should handle line feeds", () => {
		lexer = new Lexer("\n\n\na b c\n\n\n", 0, fileTable);
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"Line(`\\n\\n\\n`)",
			"Id(`a`)",
			"Id(`b`)",
			"Id(`c`)",
			"Line(`\\n\\n\\n`)",
			"EndOfFile(``)",
		]);
	});
	it("should handle incorrect numbers", () => {
		lexer = new Lexer(
			"1. 1.2e- 1e23 1.2e34 123.456e789 123.456e-789 123.456E+789",
			0,
			fileTable
		);
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"ErrorToken(`Lexical error in test.play at 1:0 (0) with text `1.`. Decimal number is missing.`)",
			"ErrorToken(`Lexical error in test.play at 1:3 (3) with text `1.2e-`. Exponent not followed by a number.`)",
			"Number(`1e23`)",
			"Number(`1.2e34`)",
			"Number(`123.456e789`)",
			"Number(`123.456e-789`)",
			"Number(`123.456E+789`)",
			"EndOfFile(``)",
		]);
	});
	it("should read string and escape sequences", () => {
		lexer = new Lexer('"a\\n\\tb" "abc" "\\n\\t \\n \\t"', 0, fileTable);
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"String(`a\\n\\tb`)",
			"String(`abc`)",
			"String(`\\n\\t \\n \\t`)",
			"EndOfFile(``)",
		]);
	});
	it("should read basic operators", () => {
		lexer = new Lexer("a+b-c%2+=3*4/=3", 0, fileTable);
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"Id(`a`)",
			"Plus(`+`)",
			"Id(`b`)",
			"Minus(`-`)",
			"Id(`c`)",
			"Percent(`%`)",
			"Number(`2`)",
			"PlusEqual(`+=`)",
			"Number(`3`)",
			"Asterisk(`*`)",
			"Number(`4`)",
			"SlashEqual(`/=`)",
			"Number(`3`)",
			"EndOfFile(``)",
		]);
	});
	it("should understand line continuations", () => {
		lexer = new Lexer("a+b-c%2_\n+=3*_\n4/=3", 0, fileTable);
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"Id(`a`)",
			"Plus(`+`)",
			"Id(`b`)",
			"Minus(`-`)",
			"Id(`c`)",
			"Percent(`%`)",
			"Number(`2`)",
			"LineContinuation(`_`)",
			"Line(`\\n`)",
			"PlusEqual(`+=`)",
			"Number(`3`)",
			"Asterisk(`*`)",
			"LineContinuation(`_`)",
			"Line(`\\n`)",
			"Number(`4`)",
			"SlashEqual(`/=`)",
			"Number(`3`)",
			"EndOfFile(``)",
		]);
	});
});
