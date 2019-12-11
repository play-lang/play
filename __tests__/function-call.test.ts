import { runFile, str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("simple function call", () => {
	test("should parse a function", () => {
		const code = str`
			function myAction(): str {
				return
				return 3 + 4
			}
		`;
		const result = Play.describeAstAsJSON(code);
		expect(result).toEqual({
			type: "program",
			start: 0,
			end: 46,
			statements: [
				{
					type: "function-decl",
					start: 0,
					end: 46,
					typeAnnotation: ["str"],
					parameters: [],
					parameterTypes: [],
					block: {
						type: "block",
						start: 25,
						end: 46,
						isActionBlock: true,
						statements: [
							{
								type: "return",
								start: 27,
								end: 33,
							},
							{
								type: "return-value",
								start: 45,
								end: 46,
								value: {
									type: "binary-expr",
									start: 41,
									end: 46,
									lhs: {
										type: "literal",
										start: 41,
										end: 42,
										literalType: "Number",
										literalValue: "3",
									},
									rhs: {
										type: "literal",
										start: 45,
										end: 46,
										literalType: "Number",
										literalValue: "4",
									},
								},
							},
						],
					},
				},
			],
		});
	});

	// Things to test:
	// - Functions called out of defined order
	// - Shadowed variables
	// - Variables get popped from stack when scope exits

	describe("variable handling", () => {
		test("should handle local variables", () => {
			const code = str`
				first(1, 2)
				function first(a: num, b: num): num {
					return second(a, b)
				}
				function second(a: num, b: num): num {
					return a + b
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(3);
		});
		test("should allow function calls out of order from declaration", () => {
			const code = str`
				function first(a: num, b: num): num {
					return a + b
				}
				second(1, 2)
				function second(a: num, b: num): num {
					return first(a, b)
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(3);
		});
		test("should mix local and global variables", () => {
			const code = str`
				let a: num = 10
				return add(1)
				function add(c: num): num {
					return a + c
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(11);
		});
		test("should support blank functions with globals", () => {
			const code = str`
					let a: num = 10
					return add(1) // nil
					function add(c: num): num {}
				`;
			const result = Play.run(code);
			expect(result.value.value).toBe(null);
		});
		test("should handle recursive fibonacci", async () => {
			const result = await runFile("fib12.play");
			expect(result).toBe(144);
		});
	});
});
