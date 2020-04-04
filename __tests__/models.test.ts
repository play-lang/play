import { Play } from "src/play";

describe("models", () => {
	describe("parsing and printing", () => {
		const code = `
			model MyModel {
				let x: num
				let y: str
				let z: bool
			}
		`;
		test("tree printing", () => {
			const tree = Play.describeAst(code);
			expect(tree).toEqual(
				// JSON.stringify(tree)
				"Program\n      └── Model\n            ├── VariableDeclarationNode(`x`, num)\n            ├── VariableDeclarationNode(`y`, str)\n            └── VariableDeclarationNode(`z`, bool)\n"
			);
		});
		test("json printing", () => {
			const tree = Play.describeAstAsJSON(code);
			expect(tree).toEqual({
				type: "ProgramNode",
				start: 0,
				end: 9,
				isDead: false,
				isLast: false,
				statements: [
					{
						type: "ModelNode",
						start: 4,
						end: 9,
						parent: "ProgramNode",
						isDead: false,
						isLast: true,
						properties: [
							{
								type: "VariableDeclarationNode",
								start: 24,
								end: 34,
								parent: "ModelNode",
								isDead: false,
								isLast: false,
								name: "x",
								typeAnnotation: ["num"],
								isImmutable: true,
							},
							{
								type: "VariableDeclarationNode",
								start: 39,
								end: 49,
								parent: "ModelNode",
								isDead: false,
								isLast: false,
								name: "y",
								typeAnnotation: ["str"],
								isImmutable: true,
							},
							{
								type: "VariableDeclarationNode",
								start: 54,
								end: 65,
								parent: "ModelNode",
								isDead: false,
								isLast: true,
								name: "z",
								typeAnnotation: ["bool"],
								isImmutable: true,
							},
						],
					},
				],
			});
		});
	});
});
