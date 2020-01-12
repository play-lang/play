import { runFile, str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("simple function call", () => {
	test("should parse a function", () => {
		const code = str`
			function myFunction(): str {
				return
				return 3 + 4
			}
		`;
		const result = Play.describeAstAsJSON(code);
		expect(result).toEqual({
			end: 48,
			start: 0,
			statements: [
				{
					block: {
						end: 48,
						isFunctionBlock: true,
						start: 27,
						statements: [
							{
								end: 35,
								start: 29,
								type: "ReturnStatementNode",
							},
							{
								end: 48,
								start: 47,
								type: "ReturnStatementNode",
								value: {
									end: 48,
									lhs: {
										end: 44,
										literalType: "Number",
										literalValue: "3",
										start: 43,
										type: "PrimitiveExpressionNode",
									},
									rhs: {
										end: 48,
										literalType: "Number",
										literalValue: "4",
										start: 47,
										type: "PrimitiveExpressionNode",
									},
									start: 43,
									type: "BinaryExpressionNode",
								},
							},
						],
						type: "BlockStatementNode",
					},
					end: 48,
					parameterTypes: [],
					parameters: [],
					start: 0,
					type: "FunctionDeclarationNode",
					typeAnnotation: ["str"],
				},
			],
			type: "ProgramNode",
		});
	});

	// Things to test:
	// - Functions called out of defined order
	// - Shadowed variables
	// - Variables get popped from stack when scope exits

	describe("variable handling", () => {
		test("local variables", () => {
			const code = str`
				return first(1, 2)
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
		test("function calls out of order from declaration", () => {
			const code = str`
				function first(a: num, b: num): num {
					return a + b
				}
				return second(1, 2)
				function second(a: num, b: num): num {
					return first(a, b)
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(3);
		});
		test("mixing local and global variables", () => {
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
		test("blank functions with globals", () => {
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
		test("lots of variables", () => {
			const code = str`
				let a: num = 10
				let b: num = 20
				let c = a + b

				return add(c, c) // 60

				function add(a: num, b: num): num {
					return a + b
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(60);
		});
		test("nested scopes", () => {
			const code = str`
				return add(1, 2)
				function add(p1: num, p2: num) {
					var a = 3
					{
						var b = 4
						{
							let c = 5
							b = b + c // b = 9
						}
						a = a + b // 9 + 3
					}
					return a + p1 + p2 // 12 + 3
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(15);
		});
	});
});
