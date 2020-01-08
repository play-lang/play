import { disassembleFile, disassembleFinalFile } from "../shared/test-utils";
// import { Play } from "../src/play";

describe("disassembler", () => {
	// 	test("should disassemble labels", () => {
	// 		const code = "return false ? 1+2 : (true ? 3+4 : 5+6)";
	// 		const dis = Play.disassemble(code);
	// 		const expected = `.CONSTANTS
	// 	0000	Number	1
	// 	0001	Number	2
	// 	0002	Number	3
	// 	0003	Number	4
	// 	0004	Number	5
	// 	0005	Number	6

	// .CODE
	// LABEL_0000: ; (CONTEXT) 0 LOCAL
	// 	0000	               FALSE
	// 	0001	        JUMPFALSEPOP	LABEL_0001
	// 	0003	            CONSTANT	(0)	= 1
	// 	0005	            CONSTANT	(1)	= 2
	// 	0007	                 ADD
	// 	0008	                JUMP	LABEL_0003
	// LABEL_0001:
	// 	0010	                TRUE
	// 	0011	        JUMPFALSEPOP	LABEL_0002
	// 	0013	            CONSTANT	(2)	= 3
	// 	0015	            CONSTANT	(3)	= 4
	// 	0017	                 ADD
	// 	0018	                JUMP	LABEL_0003
	// LABEL_0002:
	// 	0020	            CONSTANT	(4)	= 5
	// 	0022	            CONSTANT	(5)	= 6
	// 	0024	                 ADD
	// LABEL_0003:
	// 	0025	              RETURN
	// `;
	// 		expect(dis).toBe(expected);
	// 	});
	// test("should disassemble multiple contexts", () => {});
	test("should disassemble multiple linked contexts", async () => {
		const dis = await disassembleFile("fib12.play");
		console.log(dis);
		const disFinal = await disassembleFinalFile("fib12.play");
		console.log(disFinal);
	});
});