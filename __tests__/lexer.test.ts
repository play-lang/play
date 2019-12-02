import { AvlTree } from "../src/common/avl-tree";
import { SourceFile } from "../src/language/source-file";
import { TokenType } from "../src/language/token-type";
import { Lexer } from "../src/lexer/lexer";

describe("lexer", () => {
	const lexer = new Lexer("10 + 20 -123.4e-56");
	it("should initialize sensibly", () => {
		expect(lexer).toBeInstanceOf(Lexer);
	});
	it("should read the first token and lookahead", () => {
		expect(lexer.token.description).toBe("Number(`10`)");
		expect(lexer.lookahead.description).toBe("Plus(`+`)");
	});
	it("should have right number of tokens scanned", () => {
		expect(lexer.numTokens).toBe(3); // Whitespace counts
	});
	it("should pass odds and ends tests", () => {
		expect(lexer.isWhitespace("")).toBe(false);
	});
	it("should read trivia at the end of the document", () => {
		const lexer = new Lexer(`/* comment */ \t // comment`);
		expect(lexer.token.type).toBe(TokenType.EndOfFile);
		expect(lexer.lookahead.type).toBe(TokenType.EndOfFile);
		expect(lexer.numTokens).toBe(3);
		const results = lexer.readAll();
		expect(results).toHaveLength(1);
		expect(results[0].type).toBe(TokenType.EndOfFile);
		expect(results[0].trivia).toHaveLength(3);
	});
	it("should coalesce error tokens", () => {
		const lexer = new Lexer(`10+@@@@+10`);
		const results = lexer.readAll();
		// Only 1 warning should be produced
		expect(results).toHaveLength(6);
		expect(results[2].lexeme).toBe("@@@@");
	});
	it("should detect invalid escape warnings", () => {
		const lexer = new Lexer(`"\\x"`);
		lexer.readAll();
		expect(lexer.warnings).toHaveLength(1);
		expect(lexer.warnings).toEqual([
			{
				column: 3,
				file: {
					path: "source",
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
	it("should detect unclosed comments", () => {
		const lexer = new Lexer(`/* unclosed block comment \n goes here`);
		const results = lexer.readAll();
		expect(results).toHaveLength(1);
		expect(results[0].type).toEqual(TokenType.Error);
	});
	it("should detect proper block comment", () => {
		const lexer = new Lexer(`/* good block comment */`);
		const results = lexer.readAll();
		expect(results).toHaveLength(1);
		expect(results[0].type).toEqual(TokenType.EndOfFile);
		expect(results[0].trivia[0].type).toEqual(TokenType.CommentBlock);
	});
	it("should detect invalid tokens in comment logic", () => {
		const lexer = new Lexer(`/@ not a comment`);
		const results = lexer.readAll();
		expect(results.length).toBe(6);
		expect(results[1].type).toEqual(TokenType.Error);
	});
	it("should look up id tokens", () => {
		const lexer = new Lexer(`true false`);
		const results = lexer.readAll();
		expect(results.length).toBe(3);
		expect(results[0].lexeme).toBe("true");
		expect(results[1].lexeme).toBe("false");
	});
	it("should recognize unclosed strings", () => {
		const lexer = new Lexer(`" unclosed string \n goes here`);
		const results = lexer.readAll();
		expect(results).toHaveLength(5);
		expect(results[0].type).toEqual(TokenType.Error);
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
		const lexer = new Lexer("_id1 id2 3id ++id4");
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
		const lexer = new Lexer("\n\n\na b c\n\n\n");
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
		const lexer = new Lexer(
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
	it("should read string and escape sequences", () => {
		const lexer = new Lexer('"a\\n\\tb" "abc" "\\n\\t \\n \\t"');
		const tokens = lexer.readAll().map(token => token.description);
		expect(tokens).toEqual([
			"String(`a\\n\\tb`)",
			"String(`abc`)",
			"String(`\\n\\t \\n \\t`)",
			"EndOfFile(``)",
		]);
	});
	it("should read basic operators", () => {
		const lexer = new Lexer("a+b-c%2+=3*4/=3");
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
		const lexer = new Lexer("a+b-c%2_\n+=3*_\n4/=3");
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
	it("should resolve file table correctly for tokens", () => {
		const a = new SourceFile("a");
		const b = new SourceFile("b");
		const c = new SourceFile("c");
		const d = new SourceFile("d");
		const ranges = new AvlTree<number, SourceFile>();
		ranges.insert(0, a);
		ranges.insert(13, b);
		ranges.insert(20, c);
		ranges.insert(27, d);
		const lexer = new Lexer(
			"a_file a_file b_file c_file d_file d_file",
			new SourceFile("test.play"),
			ranges
		);
		const tokens = lexer.readAll().map(token => token.file.path);
		// One extra token for the end-of-file token
		expect(tokens).toEqual(["a", "a", "b", "c", "d", "d", "d"]);
	});

	it("should throw error on faulty lower bound in range tree", () => {
		const ranges = new AvlTree<number, SourceFile>();
		expect(() => {
			new Lexer(
				"a_file a_file b_file c_file d_file d_file",
				new SourceFile("test.play"),
				ranges
			);
		}).toThrow();
	});
});
