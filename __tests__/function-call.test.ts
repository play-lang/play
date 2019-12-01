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
	// 				numParameters: 0,
	// 				parameters: [],
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

	it("should generate the right bytecode", () => {
		const code = str`
		first()
		second()
		action first(): num {
			return 3 + 4
		}
		action second(): num {
			return 5 + 6
		}
	`;
		// const compiledProgram = Play.link(code);
		const desc = Play.disassemble(code);
		// const bytecode = compiledProgram.program.bytecode;
		console.log(desc);
	});
});
