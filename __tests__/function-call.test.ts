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
		const tree = Play.describeAstAsJSON(code);
		expect(tree).toEqual({
			type: "ProgramNode",
			start: 0,
			end: 48,
			isDead: false,
			isLast: false,
			statements: [
				{
					type: "FunctionDeclarationNode",
					start: 0,
					end: 48,
					parent: "ProgramNode",
					isDead: false,
					isLast: true,
					typeAnnotation: ["str"],
					parameterTypes: [],
					parameters: [],
					block: {
						type: "BlockStatementNode",
						start: 27,
						end: 48,
						parent: "FunctionDeclarationNode",
						isDead: false,
						isLast: true,
						isFunctionBlock: true,
						statements: [
							{
								type: "ReturnStatementNode",
								start: 29,
								end: 35,
								parent: "BlockStatementNode",
								isDead: false,
								isLast: false,
							},
							{
								type: "ReturnStatementNode",
								start: 47,
								end: 48,
								parent: "BlockStatementNode",
								isDead: true,
								isLast: true,
								value: {
									type: "BinaryExpressionNode",
									start: 43,
									end: 48,
									parent: "ReturnStatementNode",
									isDead: true,
									isLast: true,
									lhs: {
										type: "PrimitiveExpressionNode",
										start: 43,
										end: 44,
										parent: "BinaryExpressionNode",
										isDead: true,
										isLast: true,
										literalType: "Number",
										literalValue: "3",
									},
									rhs: {
										type: "PrimitiveExpressionNode",
										start: 47,
										end: 48,
										parent: "BinaryExpressionNode",
										isDead: true,
										isLast: true,
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
		test("super simple case", () => {
			const code = str`
return same(1)
function same(a: num): num {
	return a
}
			`;
			expect(Play.run(code).value.value).toBe(1);
		});
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

	describe("recursion", () => {
		test("should handle recursive fibonacci", async () => {
			const result = await runFile("fib12.play");
			expect(result).toBe(144);
		});
	});

	describe("tail recursion", () => {
		test("tail recursion with factorial (not fibonacci)", () => {
			const code = str`
	return fact(6, 1)
	function fact(n: num, temp: num): num {
	if (n == 1) {
		return temp
	} else {
		return fact(n - 1, n * temp)
	}
	}
	`;
			console.log(Play.disassembleFinal(code));
			expect(Play.run(code).value.value).toBe(720);
		});
	});
});
