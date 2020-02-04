
| Bytecode     | Parameters | Description                                                  |
|--------------|------------|--------------------------------------------------------------|
| RETURN       |            | Returns the top value of the stack                           |
| CONST        | index      | Push constant from pool with the specified index onto stack  |
| POP          |            | Remove the top item from the stack and discard it            |
| DROP         | nItems     | Discard the specified number of items from top of the stack  |
| GET          | index      | Push a copy of item in the stack at relative index to frame  |
| SET          | index      | Sets item on the stack with relative index to value at top   |
| GETGLOBAL    | index      | Push a copy of item in the stack with absolute index         |
| SETGLOBAL    | index      | Sets item on the stack with absolute index to value at top   |
| NEG          |            | Negate the value on the top of the stack                     |
| INC          | index      | Increment the numeric value specified by relative index      |
| DEC          | index      | Decrement the numeric value specified by relative index      |
| INCGLOBAL    | index      | Increment the numeric value specified by relative index      |
| DECGLOBAL    | index      | Decrement the numeric value specified by relative index      |
| ADD          |            | Add top two values on stack and replace with sum             |
| SUB          |            | Subtract top two values on stack and replace with difference |
| MUL          |            | Multiply top two values on stack and replace with product    |
| DIV          |            | Divide top two values on stack and replace with quotient     |
| REMAIN       |            | Divide top two values on stack and replace with remainder    |
| EXP          |            | Raise previous value to top value and replace with power     |
| LESS         |            | Replace top two values with boolean prev < top               |
| LESSEQUAL    |            | Replace top two values with boolean prev <= top              |
| GREATER      |            | Replace top two values with boolean prev > top               |
| GREATEREQUAL |            | Replace top two values with boolean prev >= top              |
| EQUAL        |            | Replace top two values with boolean prev == top              |
| UNEQUAL      |            | Replace top two values with boolean prev != top              |
| NOT          |            | Replace top value with logical opposite                      |
| NIL          |            | Push the nil value                                           |
| ZERO         |            | Push zero                                                    |
| BLANK        |            | Push blank string                                            |
| TRUE         |            | Push true                                                    |
| FALSE        |            | Push false                                                   |
| JMP          | addr       | Unconditional jump to specified address                      |
| JMPFALSE     | addr       | Jump to specified address if top of the stack is false       |
| JMPTRUE      | addr       | Jump to specified address if top of the stack is true        |
| JMPFALSEPOP  | addr       | Jump to specified address and pop if top is false            |
| JMPTRUEPOP   | addr       | Jump to specified address and pop if top is true             |
| LOOP         | addr       | Jump backwards to specified address                          |
| LOAD         | fnAddr     | Push the specified function address onto the stack           |
| TAIL         | numLocals  | Same as CALL but does not allocate a new call frame on stack |
| CALL         | numLocals  | Call address on top with specified number of local variables |
| MAKELIST     | numItems   | Construct a list from the top numItems on the stack          |
| MAKESET      | numItems   | Construct a set from the top numItems on the stack           |
| MAKEMAP      | numItems   | Construct a map from the top numItems key/value pairs        |