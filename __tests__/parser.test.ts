import { Play } from "../src/play";

describe("parser", () => {
	test("should parse", () => {
		const tree = Play.describeAstAsJSON("a + ((b - c) * 2)^-2 / 3 % 4");
		expect(JSON.parse(JSON.stringify(tree))).toEqual({
			end: 28,
			start: 0,
			statements: [
				{
					end: 28,
					expr: {
						end: 28,
						lhs: {
							end: 1,
							name: "a",
							start: 0,
							type: "IdExpressionNode",
							usedAsFunction: false,
						},
						rhs: {
							end: 28,
							lhs: {
								end: 24,
								lhs: {
									end: 20,
									lhs: {
										end: 16,
										lhs: {
											end: 11,
											lhs: {
												end: 7,
												name: "b",
												start: 6,
												type: "IdExpressionNode",
												usedAsFunction: false,
											},
											rhs: {
												end: 11,
												name: "c",
												start: 10,
												type: "IdExpressionNode",
												usedAsFunction: false,
											},
											start: 6,
											type: "BinaryExpressionNode",
										},
										rhs: {
											end: 16,
											literalType: "Number",
											literalValue: "2",
											start: 15,
											type: "PrimitiveExpressionNode",
										},
										start: 6,
										type: "BinaryExpressionNode",
									},
									rhs: {
										end: 20,
										rhs: {
											end: 20,
											literalType: "Number",
											literalValue: "2",
											start: 19,
											type: "PrimitiveExpressionNode",
										},
										start: 18,
										type: "PrefixExpressionNode",
									},
									start: 6,
									type: "BinaryExpressionNode",
								},
								rhs: {
									end: 24,
									literalType: "Number",
									literalValue: "3",
									start: 23,
									type: "PrimitiveExpressionNode",
								},
								start: 6,
								type: "BinaryExpressionNode",
							},
							rhs: {
								end: 28,
								literalType: "Number",
								literalValue: "4",
								start: 27,
								type: "PrimitiveExpressionNode",
							},
							start: 6,
							type: "BinaryExpressionNode",
						},
						start: 0,
						type: "BinaryExpressionNode",
					},
					start: 0,
					type: "ExpressionStatementNode",
				},
			],
			type: "ProgramNode",
		});
	});
});
