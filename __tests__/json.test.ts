import { str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("json tree printer", () => {
	test("should convert a simple AST to JSON", () => {
		const code = str`let myNum: num = 10 + 20 + 30
			myNum`;
		const json = Play.describeAstAsJSON(code);
		expect(json).toEqual({
			end: 35,
			start: 0,
			statements: [
				{
					end: 29,
					expr: {
						end: 29,
						lhs: {
							end: 24,
							lhs: {
								end: 19,
								literalType: "Number",
								literalValue: "10",
								start: 17,
								type: "PrimitiveExpressionNode",
							},
							rhs: {
								end: 24,
								literalType: "Number",
								literalValue: "20",
								start: 22,
								type: "PrimitiveExpressionNode",
							},
							start: 17,
							type: "BinaryExpressionNode",
						},
						rhs: {
							end: 29,
							literalType: "Number",
							literalValue: "30",
							start: 27,
							type: "PrimitiveExpressionNode",
						},
						start: 17,
						type: "BinaryExpressionNode",
					},
					isImmutable: true,
					name: "myNum",
					start: 0,
					type: "VariableDeclarationNode",
					typeAnnotation: ["num"],
				},
				{
					end: 35,
					expr: {
						end: 35,
						start: 30,
						type: "IdExpressionNode",
						name: "myNum",
						usedAsFunction: false,
					},
					start: 30,
					type: "ExpressionStatementNode",
				},
			],
			type: "ProgramNode",
		});
	});
});
