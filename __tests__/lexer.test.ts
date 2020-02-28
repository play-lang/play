import { AvlTree } from "../src/common/avl-tree";
import { SourceFile } from "../src/language/source-file";
import { TokenType } from "../src/language/token-type";
import { Lexer } from "../src/lexer/lexer";

describe("lexer", () => {
	const lexer = newLexer("10 + 20 -123.4e-56");
	test("should initialize sensibly", () => {
		expect(lexer).toBeInstanceOf(Lexer);
	});
	test("should read the first token and lookahead", () => {
		expect(lexer.token.description).toBe("Number(`10`)");
		expect(lexer.lookahead.description).toBe("Plus(`+`)");
	});
	test("should have right number of tokens scanned", () => {
		expect(lexer.numTokens).toBe(3); // Whitespace counts
	});
	test("should pass odds and ends tests", () => {
		expect(lexer.isWhitespace("")).toBe(false);
	});
	test("should read trivia at the end of the document", () => {
		const lexer = newLexer(`/* comment */ \t // comment`);
		expect(lexer.token.type).toBe(TokenType.EndOfFile);
		expect(lexer.lookahead.type).toBe(TokenType.EndOfFile);
		expect(lexer.numTokens).toBe(3);
		const results = lexer.readAll();
		expect(results).toHaveLength(1);
		expect(results[0].type).toBe(TokenType.EndOfFile);
		expect(results[0].trivia).toHaveLength(3);
	});
	test("should coalesce error tokens", () => {
		const lexer = newLexer(`10+@@@@+10`);
		const results = lexer.readAll();
		// Only 1 warning should be produced
		expect(results).toHaveLength(6);
		expect(results[2].lexeme).toBe("@@@@");
	});
	test("should detect invalid escape warnings", () => {
		const lexer = newLexer(`"\\x"`);
		lexer.readAll();
		expect(lexer.warnings).toHaveLength(1);
		expect(lexer.warnings).toEqual([
			{
				column: 3,
				file: {
					path: "source",
					contents: `"\\x"`,
				},
				hints: new Set(["Unknown escape sequence."]),
				length: 1,
				lexeme: '"',
				line: 1,
				pos: 3,
				trivia: [],
				type: 0,
			},
		]);
	});
	test("should detect unclosed comments", () => {
		const lexer = newLexer(`/* unclosed block comment \n goes here`);
		const results = lexer.readAll();
		expect(results).toHaveLength(1);
		expect(results[0].type).toEqual(TokenType.Error);
	});
	test("should detect proper block comment", () => {
		const lexer = newLexer(`/* good block comment */`);
		const results = lexer.readAll();
		expect(results).toHaveLength(1);
		expect(results[0].type).toEqual(TokenType.EndOfFile);
		expect(results[0].trivia[0].type).toEqual(TokenType.CommentBlock);
	});
	test("should detect invalid tokens in comment logic", () => {
		const lexer = newLexer(`/@ not a comment`);
		const results = lexer.readAll();
		expect(results.length).toBe(6);
		expect(results[1].type).toEqual(TokenType.Error);
	});
	test("should look up id tokens", () => {
		const lexer = newLexer(`true false`);
		const results = lexer.readAll();
		expect(results.length).toBe(3);
		expect(results[0].lexeme).toBe("true");
		expect(results[1].lexeme).toBe("false");
	});
	test("should recognize unclosed strings", () => {
		const lexer = newLexer(`" unclosed string \n goes here`);
		const results = lexer.readAll();
		expect(results).toHaveLength(5);
		expect(results[0].type).toEqual(TokenType.Error);
	});
	test("should tokenize basic numbers", () => {
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
	test("should tokenize basic id's", () => {
		const lexer = newLexer("_id1 id2 3id ++id4");
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
	test("should handle line feeds", () => {
		const lexer = newLexer("\n\n\na b c\n\n\n");
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
	test("should handle incorrect numbers", () => {
		const lexer = newLexer(
			"1. 1.2e- 1e23 1.2e34 123.456e789 123.456e-789 123.456E+789"
		);
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"ErrorToken(`Lexical error in source at 1:0 (0) with text `1.`. Decimal number is missing.`)",
			"ErrorToken(`Lexical error in source at 1:3 (3) with text `1.2e-`. Exponent not followed by a number.`)",
			"Number(`1e23`)",
			"Number(`1.2e34`)",
			"Number(`123.456e789`)",
			"Number(`123.456e-789`)",
			"Number(`123.456E+789`)",
			"EndOfFile(``)",
		]);
	});
	test("should read string and escape sequences", () => {
		const lexer = newLexer('"a\\n\\tb" "abc" "\\n\\t \\n \\t"');
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"String(`a\\n\\tb`)",
			"String(`abc`)",
			"String(`\\n\\t \\n \\t`)",
			"EndOfFile(``)",
		]);
	});
	test("should read basic operators", () => {
		const lexer = newLexer("a+b-c%2+=3*4/=3");
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
	test("should understand line continuations", () => {
		const lexer = newLexer("a+b-c%2_\n+=3*_\n4/=3");
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

describe("lexer file table", () => {
	test("should resolve file table correctly for tokens", () => {
		const a = new SourceFile("a", "");
		const b = new SourceFile("b", "");
		const c = new SourceFile("c", "");
		const d = new SourceFile("d", "");
		const ranges = new AvlTree<number, SourceFile>();
		ranges.insert(0, a);
		ranges.insert(13, b);
		ranges.insert(20, c);
		ranges.insert(27, d);
		const lexer = new Lexer(
			new SourceFile("test.play", "a_file a_file b_file c_file d_file d_file"),
			ranges
		);
		const tokens = lexer.readAll().map(token => token.file.path);
		// One extra token for the end-of-file token
		expect(tokens).toEqual(["a", "a", "b", "c", "d", "d", "d"]);
	});

	test("should throw error on faulty lower bound in range tree", () => {
		const ranges = new AvlTree<number, SourceFile>();
		expect(() => {
			new Lexer(
				new SourceFile(
					"test.play",
					"a_file a_file b_file c_file d_file d_file"
				),
				ranges
			);
		}).toThrow();
	});
});

function newLexer(contents: string): Lexer {
	return new Lexer(new SourceFile("source", contents));
}
