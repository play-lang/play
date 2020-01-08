import { Play } from "../src/play";

describe("disassembler", () => {
	test("should disassemble labels", () => {
		const code = "return false ? 1+2 : (true ? 3+4 : 5+6)";
		const dis = Play.disassemble(code);
		console.log(dis);
		const dis2 = Play.disassemble2(code);
		console.log(dis2);
	});
});
