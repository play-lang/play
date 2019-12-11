import { run, str } from "../shared/test-utils";
describe("block scope", () => {
	test("should know about deeply nested block-scoped variables", async () => {
		const code = str`
		function deepNest(a: num): num {
			let b: num = a
			{
				let c: num = a
				{
					// return
					let d: num = c * 2
					// return
					a = d
				}
			}
			// Return from here should pop a, b, c, d
			return a
		}
		return deepNest(20)
		`;
		expect(await run(code)).toEqual(40);
	});
});
