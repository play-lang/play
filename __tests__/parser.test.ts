import { Play } from "../src/play";

describe("parser", () => {
	it("should parse", () => {
		const tree = Play.describeAstAsJSON("a + ((b - c) * 2)^-2 / 3 % 4");
		expect(tree).toEqual({
			type: "program",
			start: 0,
			end: 28,
			statements: [
				{
					type: "binary-expr",
					start: 0,
					end: 28,
					lhs: { type: "action-ref", start: 0, end: 1, actionName: "a" },
					rhs: {
						type: "binary-expr",
						start: 6,
						end: 28,
						lhs: {
							type: "binary-expr",
							start: 6,
							end: 24,
							lhs: {
								type: "binary-expr",
								start: 6,
								end: 20,
								lhs: {
									type: "binary-expr",
									start: 6,
									end: 16,
									lhs: {
										type: "binary-expr",
										start: 6,
										end: 11,
										lhs: {
											type: "action-ref",
											start: 6,
											end: 7,
											actionName: "b",
										},
										rhs: {
											type: "action-ref",
											start: 10,
											end: 11,
											actionName: "c",
										},
									},
									rhs: {
										type: "literal",
										start: 15,
										end: 16,
										literalType: "Number",
										literalValue: "2",
									},
								},
								rhs: {
									type: "prefix-expr",
									start: 18,
									end: 20,
									rhs: {
										type: "literal",
										start: 19,
										end: 20,
										literalType: "Number",
										literalValue: "2",
									},
								},
							},
							rhs: {
								type: "literal",
								start: 23,
								end: 24,
								literalType: "Number",
								literalValue: "3",
							},
						},
						rhs: {
							type: "literal",
							start: 27,
							end: 28,
							literalType: "Number",
							literalValue: "4",
						},
					},
				},
			],
		});
	});
});
