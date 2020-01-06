
| Bytecode         | Parameters | Description                                                  |
|------------------|------------|--------------------------------------------------------------|
| RETURN           |            | Returns the top value of the stack                           |
| CONSTANT         | index      | Push constant from pool with the specified index onto stack  |
| POP              |            | Remove the top item from the stack and discard it            |
| DROP             | nItems     | Discard the specified number of items from top of the stack  |
| GET              | index      | Push a copy of item in the stack at relative index to frame  |
| SET              | index      | Sets item on the stack with relative index to value at top   |
| GETGLOBAL        | index      | Push a copy of item in the stack with absolute index         |
| SETGLOBAL        | index      | Sets item on the stack with absolute index to value at top   |
| NEG              |            | Negate the value on the top of the stack                     |
| INC              |            | Increment the value on the top of the stack by one           |
| DEC              |            | Decrement the value on the top of the stack by one           |
| ADD              |            | Add top two values on stack and replace with sum             |
| SUB              |            | Subtract top two values on stack and replace with difference |
| MUL              |            | Multiply top two values on stack and replace with product    |
| DIV              |            | Divide top two values on stack and replace with quotient     |
| REMAIN           |            | Divide top two values on stack and replace with remainder    |
| EXP              |            | Raise previous value to top value and replace with power     |
| LESSTHAN         |            | Replace top two values with boolean prev < top               |
| LESSTHANEQUAL    |            | Replace top two values with boolean prev <= top              |
| GREATERTHAN      |            | Replace top two values with boolean prev > top               |
| GREATERTHANEQUAL |            | Replace top two values with boolean prev >= top              |
| EQUALITY         |            | Replace top two values with boolean prev == top              |
| INEQUALITY       |            | Replace top two values with boolean prev != top              |
| NOT              |            | Replace top value with logical opposite                      |
| NIL              |            | Push the nil value                                           |
| ZERO             |            | Push zero                                                    |
| BLANK            |            | Push blank string                                            |
| TRUE             |            | Push true                                                    |
| FALSE            |            | Push false                                                   |
| JUMP             | addr       | Unconditional jump to specified address                      |
| JUMPFALSE        | addr       | Jump to specified address if top of the stack is false       |
| JUMPTRUE         | addr       | Jump to specified address if top of the stack is true        |
| JUMPFALSEPOP     | addr       | Jump to specified address and pop if top is false            |
| JUMPTRUEPOP      | addr       | Jump to specified address and pop if top is true             |
| LOAD             | fnAddr     | Push the specified function address onto the stack           |
| CALL             | numLocals  | Call address on top with specified number of local variables |