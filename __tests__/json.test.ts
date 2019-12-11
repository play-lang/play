import { str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("json tree printer", () => {
	test("should convert a simple AST to JSON", () => {
		const code = str`let myNum: num = 10 + 20 + 30
			myNum`;
		const json = Play.describeAstAsJSON(code);
		expect(json).toEqual({
			type: "program",
			start: 0,
			end: 35,
			statements: [
				{
					type: "var-decl",
					start: 0,
					end: 29,
					name: "myNum",
					typeAnnotation: ["num"],
					isImmutable: true,
					expr: {
						type: "binary-expr",
						start: 17,
						end: 29,
						lhs: {
							type: "binary-expr",
							start: 17,
							end: 24,
							lhs: {
								type: "literal",
								start: 17,
								end: 19,
								literalType: "Number",
								literalValue: "10",
							},
							rhs: {
								type: "literal",
								start: 22,
								end: 24,
								literalType: "Number",
								literalValue: "20",
							},
						},
						rhs: {
							type: "literal",
							start: 27,
							end: 29,
							literalType: "Number",
							literalValue: "30",
						},
					},
				},
				{
					type: "variable-ref",
					start: 30,
					end: 35,
					variableName: "myNum",
				},
			],
		});
	});
});
