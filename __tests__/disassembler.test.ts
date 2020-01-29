import { disassembleFile, disassembleFinalFile } from "../shared/test-utils";

describe("disassembler", () => {
	test("should disassemble multiple linked contexts", async () => {
		const dis = await disassembleFile("fib12.play");
		expect(dis).toBe(
			".CONSTANTS\n\t0000\tnumber\t1\n\t0001\tnumber\t2\n\t0002\tnumber\t12\n\n.CODE\n; Context (main)\n; 0 locals\nlabel_0000:\n\t0000\t               const\t 0002\t; value 12\n\t0002\t                load\t-1\t; context fib\n\t0004\t                call\t 0001\n\t0006\t              return\n; Context fib\n; 1 local\nlabel_0001:\n\t0000\t                 get\t 0000\n\t0002\t               const\t 0000\t; value 1\n\t0004\t           lessequal\n\t0005\t         jmpfalsepop\t 0004\t; label_0002 (instr  0011) \n\t0007\t                 get\t 0000\n\t0009\t                 jmp\t 0019\t; label_0003 (instr  0030) \nlabel_0002:\n\t0011\t                 get\t 0000\n\t0013\t               const\t 0000\t; value 1\n\t0015\t                 sub\n\t0016\t                load\t-1\t; context fib\n\t0018\t                call\t 0001\n\t0020\t                 get\t 0000\n\t0022\t               const\t 0001\t; value 2\n\t0024\t                 sub\n\t0025\t                load\t-1\t; context fib\n\t0027\t                call\t 0001\n\t0029\t                 add\nlabel_0003:\n\t0030\t              return\n"
		);
		const disFinal = await disassembleFinalFile("fib12.play");
		expect(disFinal).toBe(
			".CONSTANTS\n\t0000\tnumber\t1\n\t0001\tnumber\t2\n\t0002\tnumber\t12\n\n.CODE\n; Context (main)\n; 0 locals\nlabel_0000:\n\t0000\t               const\t 0002\t; value 12\n\t0002\t                load\t 0007\t; label_0001 context fib\n\t0004\t                call\t 0001\n\t0006\t              return\n; Context fib\n; 1 local\nlabel_0001:\n\t0007\t                 get\t 0000\n\t0009\t               const\t 0000\t; value 1\n\t0011\t           lessequal\n\t0012\t         jmpfalsepop\t 0004\t; label_0002 (instr  0018) \n\t0014\t                 get\t 0000\n\t0016\t                 jmp\t 0019\t; label_0003 (instr  0037) \nlabel_0002:\n\t0018\t                 get\t 0000\n\t0020\t               const\t 0000\t; value 1\n\t0022\t                 sub\n\t0023\t                load\t 0007\t; label_0001 context fib\n\t0025\t                call\t 0001\n\t0027\t                 get\t 0000\n\t0029\t               const\t 0001\t; value 2\n\t0031\t                 sub\n\t0032\t                load\t 0007\t; label_0001 context fib\n\t0034\t                call\t 0001\n\t0036\t                 add\nlabel_0003:\n\t0037\t              return\n"
		);
	});
});
