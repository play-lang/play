import { str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("json tree printer", () => {
	test("should convert a simple AST to JSON", () => {
		const code = str`let myNum: num = 10 + 20 + 30
			myNum`;
		const tree = Play.describeAstAsJSON(code);
		expect(tree).toEqual({
			type: "ProgramNode",
			start: 0,
			end: 35,
			isDead: false,
			isLast: false,
			statements: [
				{
					type: "VariableDeclarationNode",
					start: 0,
					end: 29,
					parent: "ProgramNode",
					isDead: false,
					isLast: false,
					name: "myNum",
					typeAnnotation: ["num"],
					isImmutable: true,
					expr: {
						type: "BinaryExpressionNode",
						start: 17,
						end: 29,
						parent: "VariableDeclarationNode",
						isDead: false,
						isLast: false,
						lhs: {
							type: "BinaryExpressionNode",
							start: 17,
							end: 24,
							parent: "BinaryExpressionNode",
							isDead: false,
							isLast: false,
							lhs: {
								type: "PrimitiveExpressionNode",
								start: 17,
								end: 19,
								parent: "BinaryExpressionNode",
								isDead: false,
								isLast: false,
								literalType: "Number",
								literalValue: "10",
							},
							rhs: {
								type: "PrimitiveExpressionNode",
								start: 22,
								end: 24,
								parent: "BinaryExpressionNode",
								isDead: false,
								isLast: false,
								literalType: "Number",
								literalValue: "20",
							},
						},
						rhs: {
							type: "PrimitiveExpressionNode",
							start: 27,
							end: 29,
							parent: "BinaryExpressionNode",
							isDead: false,
							isLast: false,
							literalType: "Number",
							literalValue: "30",
						},
					},
				},
				{
					type: "ExpressionStatementNode",
					start: 30,
					end: 35,
					parent: "ProgramNode",
					isDead: false,
					isLast: true,
					expr: {
						type: "IdExpressionNode",
						start: 30,
						end: 35,
						parent: "ExpressionStatementNode",
						isDead: false,
						isLast: true,
						name: "myNum",
						use: "Variable",
					},
				},
			],
		});
	});
});
