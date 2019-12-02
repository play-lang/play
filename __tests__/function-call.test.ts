import { str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("simple function call", () => {
	// it("should parse an action", () => {
	// 	const code = str`
	// 		action myAction(): str {
	// 			return
	// 			return 3 + 4
	// 		}
	// 	`;
	// 	const result = Play.describeAstAsJSON(code);
	// 	expect(result).toEqual({
	// 		type: "program",
	// 		start: 0,
	// 		end: 44,
	// 		statements: [
	// 			{
	// 				type: "action-decl",
	// 				start: 0,
	// 				end: 44,
	// 				typeAnnotation: ["str"],
	// 				parameters: [],
	// 				parameterTypes: [],
	// 				block: {
	// 					type: "block",
	// 					start: 23,
	// 					end: 44,
	// 					isActionBlock: true,
	// 					statements: [
	// 						{
	// 							type: "return",
	// 							start: 25,
	// 							end: 31,
	// 						},
	// 						{
	// 							type: "return-value",
	// 							start: 43,
	// 							end: 44,
	// 							value: {
	// 								type: "binary-expr",
	// 								start: 39,
	// 								end: 44,
	// 								lhs: {
	// 									type: "literal",
	// 									start: 39,
	// 									end: 40,
	// 									literalType: "Number",
	// 									literalValue: "3",
	// 								},
	// 								rhs: {
	// 									type: "literal",
	// 									start: 43,
	// 									end: 44,
	// 									literalType: "Number",
	// 									literalValue: "4",
	// 								},
	// 							},
	// 						},
	// 					],
	// 				},
	// 			},
	// 		],
	// 	});
	// });

	// it("should generate the right bytecode", () => {
	// 	const code = str`

	// 		first()

	// 		third()

	// 		action first(): num {
	// 			return second()
	// 		}

	// 		action second(): num {
	// 			return 5 + 6
	// 		}

	// 		action third(): num {
	// 			return 1
	// 		}
	// 	`;
	// 	const desc = Play.disassemble(code);
	// 	console.log(desc);
	// 	const result = Play.run(code);
	// 	console.log(result);
	// 	// const bytecode = compiledProgram.program.bytecode;
	// });

	// it("should handle local variables", () => {
	// 	const code = str`
	// 		first(1, 2)
	// 		action first(a: num, b: num): num {
	// 			return second(a, b)
	// 		}
	// 		action second(a: num, b: num): num {
	// 			return a + b
	// 		}
	// 	`;
	// 	const desc = Play.disassemble(code);
	// 	console.log(desc);
	// 	const result = Play.run(code);
	// 	expect(result.value.value).toBe(3);
	// 	console.log(result);
	// });

	// it("should handle local variables with recursion", () => {
	// 	const code = str`
	// 		first(0)
	// 		action first(a: num): num {
	// 			let b: num = 10
	// 			let c: num = a > 0 ? a : first(a + b)
	// 			return c
	// 		}
	// 	`;
	// 	const desc = Play.disassemble(code);
	// 	console.log(desc);
	// 	const result = Play.run(code);
	// 	expect(result.value.value).toBe(10);
	// 	console.log(result);
	// });

	// Things to test:
	// - Functions called out of defined order
	// - Shadowed variables
	// - Variables get popped from stack when scope exits

	describe("variable handling", () => {
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
		it("should handle recursion", () => {
			const code = str`
				return fib(12)
				action fib(n: num): num {
					return n <= 1 ? n : fib(n - 1) + fib(n - 2)
				}
			`;
			const result = Play.run(code);
			expect(result.value.value).toBe(144);
		});
	});
});
