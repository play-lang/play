import { str } from "../shared/test-utils";
import { Play } from "../src/play";
describe("simple function call", () => {
	// it("should parse an action", () => {
	// 	const code = str`
	// 		action myAction(): str {
	// 			3 + 4
	// 		}
	// 	`;
	// 	const result = Play.describeAstAsJSON(code);
	// 	expect(result).toEqual({
	// 		type: "program",
	// 		start: 0,
	// 		end: 30,
	// 		statements: [
	// 			{
	// 				type: "action-decl",
	// 				start: 0,
	// 				end: 30,
	// 				typeAnnotation: ["str"],
	// 				numParameters: 0,
	// 				parameters: [],
	// 				block: {
	// 					type: "block",
	// 					start: 23,
	// 					end: 30,
	// 					isActionBlock: true,
	// 					statements: [
	// 						{
	// 							type: "binary-expr",
	// 							start: 25,
	// 							end: 30,
	// 							lhs: {
	// 								type: "literal",
	// 								start: 25,
	// 								end: 26,
	// 								literalType: "Number",
	// 								literalValue: "3",
	// 							},
	// 							rhs: {
	// 								type: "literal",
	// 								start: 29,
	// 								end: 30,
	// 								literalType: "Number",
	// 								literalValue: "4",
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
		myAction()
		action myAction(): str {
			3 + 4
		}
	`;
		// const compiledProgram = Play.link(code);
		const desc = Play.disassemble(code);
		// const bytecode = compiledProgram.program.bytecode;
		console.log(desc);
	});
});
