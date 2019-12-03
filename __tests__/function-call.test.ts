import { str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("simple function call", () => {
	it("should parse an action", () => {
		const code = str`
			action myAction(): str {
				return
				return 3 + 4
			}
		`;
		const result = Play.describeAstAsJSON(code);
		expect(result).toEqual({
			type: "program",
			start: 0,
			end: 44,
			statements: [
				{
					type: "action-decl",
					start: 0,
					end: 44,
					typeAnnotation: ["str"],
					parameters: [],
					parameterTypes: [],
					block: {
						type: "block",
						start: 23,
						end: 44,
						isActionBlock: true,
						statements: [
							{
								type: "return",
								start: 25,
								end: 31,
							},
							{
								type: "return-value",
								start: 43,
								end: 44,
								value: {
									type: "binary-expr",
									start: 39,
									end: 44,
									lhs: {
										type: "literal",
										start: 39,
										end: 40,
										literalType: "Number",
										literalValue: "3",
									},
									rhs: {
										type: "literal",
										start: 43,
										end: 44,
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
		it("should handle local variables", () => {
			const code = str`
				first(1, 2)
				action first(a: num, b: num): num {
					return second(a, b)
				}
				action second(a: num, b: num): num {
					return a + b
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(3);
		});
		it("should allow function calls out of order from declaration", () => {
			const code = str`
				action first(a: num, b: num): num {
					return a + b
				}
				second(1, 2)
				action second(a: num, b: num): num {
					return first(a, b)
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(3);
		});
		it("should mix local and global variables", () => {
			const code = str`
				let a: num = 10
				return add(1)
				action add(c: num): num {
					return a + c
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(11);
		});
		it("should support blank functions with globals", () => {
			const code = str`
					let a: num = 10
					return add(1) // nil
					action add(c: num): num {}
				`;
			const result = Play.run(code);
			expect(result.value.value).toBe(null);
		});
		it("should handle recursive fibonacci", () => {
			const code = str`
				action fib(n: num): num {
					return n <= 1 ? n : fib(n - 1) + fib(n - 2)
				}
				return fib(12)
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(144);
		});
	});
});
