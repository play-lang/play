// import { checkFile } from "../shared/test-utils";
import { str } from "../shared/test-utils";
import { Play } from "../src/play";

describe("type-checker", () => {
	test("bad variable declaration", () => {
		const code = str`
		var x: str = 10
		var y: num = "hello, world"
		var z = 10
		z = "hello"
		return "a" + 10
		return 10 + 10
		return "a" + "b"
		5 = "hello"

		return doSomething(10, 10)
		var x: num = 10		
		function doSomething(a: num, b: num) {
			return a + b
		}
		`;
		const errors = Play.check(code).map(err => err.message);
		expect(errors).toEqual([
			"Type error in source at 1:4 (4) with token `x`:  Expected `x` to have type &Str instead of Num",
			"Type error in source at 2:4 (20) with token `y`:  Expected `y` to have type &Num instead of Str",
			"Type error in source at 4:0 (55) with token `z`:  Expected `z` to have type &Num instead of Str",
			"Type error in source at 5:11 (78) with token `+`:  Failed to use Str to add with Num",
			"Type error in source at 8:0 (115) with token `5`:  Invalid assignment—expected a variable reference to Num",
		]);
	});
});
