import { str } from "../shared/test-utils";
import { Play } from "../src/play";
describe("block scope", () => {
	test("should know about deeply nested block-scoped variables", async () => {
		const code = str`
		function deepNest(a: num): num {
			var b: num = a
			{
				let c: num = a
				{
					// return
					let d: num = c * 2
					// return
					b = d
				}
			}
			// Return from here should pop a, b, c, d
			return b
		}
		return deepNest(20)
		`;
		expect(Play.run(code).value.value).toEqual(40);
	});
});
