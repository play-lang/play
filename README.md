# Play

[![License][license-image]][license-url]

[license-url]: https://opensource.org/licenses/MIT
[license-image]: https://img.shields.io/npm/l/make-coverage-badge.svg

![Coverage lines](docs/resources/badge-lines.svg)
![Coverage functions](docs/resources/badge-functions.svg)
![Coverage branches](docs/resources/badge-branches.svg)
![Coverage statements](docs/resources/badge-statements.svg)

Play is a statically typed programming language written in TypeScript *with zero production dependencies*. Play consists of a *lexer*, *parser*, *preprocessor*, *type-checker*, *bytecode compiler*, *linker*, *disassembler*, *virtual machine*, and *garbage collector*.

**Note:** Play is still a young project. A large portion of the language exists and is working, but still lacks object-oriented functionality and a module system (both of which are actively being developed).

![Play Logo](/logo.png)

*Play has zero production dependencies.* All of its various components are written in [TypeScript](https://www.typescriptlang.org/), with a large amount of test coverage provided using simple [Jest](https://jestjs.io/) tests. Play uses a little bit of non-original code borrowed from other projects detailed in the [credits](#Credits) section.

## Features

- Provide an embeddable language that can run in a web browser and on the server (via [Node.js](https://nodejs.org)).

- Feature a stack-based virtual machine model of execution for easy code generation and to potentially allow for other language front-ends in the future.

- Support common language features like operator short circuiting, tail-recursion optimization, type inference, ternary operator, etc.

	Play's syntax is designed to be familiar to TypeScript/JavaScript/Swift/Kotlin developers.

- Demonstrate the basics of programming language theory in an accessible way.

	Currently, a lot of programming language theory is obscured by low-level systems language code that distracts from the algorithms themselves.

- Maintain a high degree of test coverage throughout the development process.

	Play currently has about 80% test coverage

- Encourage long-term maintainability by keeping the source code as easy to understand as possible without sacrificing functionality.
	
	The source code attempts to name classes and variables based on the terminology found in the existing literature of programming languages/compilers.

## Roadmap

Play supports basic language constructs but it's still missing some of the basics:

- Classes / objects (in development)
- Module system: e.g., dynamic linking and namespace resolution (in planning)
- First class functions (possibly someday)
- Generics (if the author can figure out the required type theory)
- Bytecode output optimization

	The only optimization supported today is tail-recursion. There is no optimization phase because the author is still unfamiliar with how optimizing compilers work.

## Components

### Parser
Play takes source code as an input string and converts it into an abstract syntax tree (AST) using a recursive-descent parser. The parser fetches token from the lexer as needed and arranges them into an AST. Expressions are parsed using a [Pratt parser](https://en.wikipedia.org/wiki/Pratt_parser).

### Preprocessor

Play provides hooks to allow you to fetch files referred to in Play code:

```play
#include "some-file.play"
```

When the Play preprocessor encounters that line, it will call the provided callback methods to resolve the contents of the file `some-file.play` and continue preprocessing.

### Type Checking

Play has a simple type system (see `src/language/types/type-system.ts`) that allows it to statically verify user programs. The type checker walks through the AST and verifies constructs have the appropriate types and are used consistently. The type checking environment currently consists of function declaration information and the symbol table.

### Compiler

The compiler walks through the verified AST and emits bytecode instructions that can be run by the virtual machine. Each function is compiled into its own compilation "context." The bytecode instructions themselves are not strongly typed so it is important to check the validity of the tree with the type-checker.

### Linker

The linker combines all the bytecode output from the compiled contexts to create a single, combined bytecode instruction sequence that can be executed by the virtual machine. Jumps between contexts are finally resolved as the bytecode instruction addresses are finally known.

### Virtual Machine

The virtual machine pretends to be a very abstract version of a computer and runs each bytecode instruction in sequence, manipulating the stack and interfacing with the garbage collector (which manages the heap).

### Garbage Collector

Play features an incremental copying/compacting garbage collector that uses Baker's algorithm with a read barrier to manage garbage while the virtual machine runs.

## Quick Start

Play code is run from the accompanying tests. All new features have tests built for them at the same time. The goal is to reach 100% test coverage as the language becomes more mature.

A static convenience class is provided for easily running Play code.

```ts
const code = `return fact(6, 1)
	// Compute a factorial recursively
	function fact(n: num, temp: num): num {
		if (n == 1) {
			return temp
		} else {
			return fact(n - 1, n * temp)
		}
	}`;

const result = Play.run(code).value.value // 720
```

The convenience method `run` returns a `VMResult` object containing a `VMValue` called `value` with yet another `value` property containing the actual JavaScript value.

Play first scans, parses, type-checks, and compiles the code into stack-based bytecode (not optimized). A dump of the disassembled bytecode can easily be obtained with the following convenience method:

```ts
console.log(Play.disassemble(code)); // uses -1 as a placeholder for unresolved addresses
console.log(Play.disassembleFinal(code)); // links and resolves addresses before disassembling
```

The above call produces:

```
.CONSTANTS
		0000    number  6
		0001    number  1

.CODE
; Context (main)
; 0 locals
label_0000:
		0000                   const     0000   ; value 6
		0002                   const     0001   ; value 1
		0004                    load     0009   ; label_0001 context fact
		0006                    call     0002
		0008                  return
; Context fact
; 2 locals
label_0001:
		0009                     get     0000
		0011                   const     0001   ; value 1
		0013                   equal
		0014             jmpfalsepop     0003   ; label_0002 (instr  0019) 
		0016                     get     0001
		0018                  return
label_0002:
		0019                     get     0000
		0021                   const     0001   ; value 1
		0023                     sub
		0024                     get     0000
		0026                     get     0001
		0028                     mul
		0029                     set     0001
		0031                     pop
		0032                     set     0000
		0034                     pop
		0035                    load     0009   ; label_0001 context fact
		0037                    tail     0002
		0039                  return
```

Full [bytecode opcode documentation](/docs/bytecode.md) is provided.

Other convenience functions allow for printing the AST as a human-friendly string or JSON:

```ts
console.log(Play.describeAst(code)); // Human friendly AST representation
console.log(Play.describeAstAsJSON(code)); // Machine friendly AST representation
```

The first line produces the following:

```
Program
  ├── Return
    └── Call(fact, tailRecursive=false)
      ├── Literal(`6`)
      └── Literal(`1`)
  └── Function num fact(num n, num temp)
    └── Block
      └── If
        ├── predicate
          └── Binary(EqualEqual)
            ├── IdExpression(n, use=Variable)
            └── Literal(`1`)
        ├── then
          └── Block
            └── Return
              └── IdExpression(temp, use=Variable)
        └── Else
          └── Block
            └── Return
              └── Call(fact, tailRecursive=true)
                ├── Binary(Minus)
                  ├── IdExpression(n, use=Variable)
                  └── Literal(`1`)
                └── Binary(Asterisk)
                  ├── IdExpression(n, use=Variable)
                  └── IdExpression(temp, use=Variable)
```

## Contributing

Contributions are greatly appreciated!

The project is designed to be edited in [VSCode](https://code.visualstudio.com/).


Clone the project:

```sh
git clone git@github.com:josephessin/play.git
```

Install development dependencies:

```sh
npm install
```

**Important**: In VSCode, open any `*.ts` file in the `src/` directory and run the command `TypeScript: Select TypeScript Version...` and specify the locally installed version. This prevents glitches with TypeScript autocomplete, particularly when refactoring imports. 

Code can be automatically formatted if you have the [TSLint extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin) installed in VSCode. You will get this functionality for free since [Prettier](https://prettier.io/) is installed locally and configured as a TSLint plugin.

[Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) is used to prevent misspellings in the codebase. The default keybinding to fix misspellings when the cursor is on a misspelled word is `Cmd + Period`. A number of additional dictionary words have been added to the vscode settings in the `.vscode/settings.json` file.

[Markdown Table Formatter](https://marketplace.visualstudio.com/items?itemName=fcrespo82.markdown-table-formatter) is used to format tables inside markdown files automatically upon save. The `.vscode/settings.json` file enables this for markdown files.

Run the tests:

```sh
npm run test
```

See test coverage:

```sh
npm run coverage
```

Build the project:

```sh
npm run build
```

You can see all of the commands available in the `package.json` file.

### How to Make a Pull Request

Write a new test for your pull request or fix an existing one.

**Important**: You can easily debug an open test file in VSCode by selecting `Debug Current Jest Test` in the Debug pane at the top **if and only if** the test file is selected in the editor. The debug configuration is provided with the project.

This is typically how changes get made to Play.

Once your changes and tests are working the way you like, submit a pull request. Please be as thorough as you can when writing tests.

*Note*: If you want to collect coverage or run a single test (but not debug it), you can run one of the following commands:

```sh
npm run test -- partial-test-name
npm run coverage -- partial-test-name
```

### Coding Style

Play code is designed to be as easy to read as possible and uses as much academic terminology in the code as possible when implementing programming language features/algorithms to make the barrier-to-entry as low as possible.

Play code attempts to use macro-optimizations (such as using the correct data structures to achieve good time complexities on operations) but doesn't particularly care about micro-optimizations. The virtual machine, however, could probably benefit from more optimizations.

The author has no formal background in programming languages (took a single class in college and self taught past that) so there may be discrepancies throughout the code base.

## Credits

Special thanks to the following projects:

- [TypeScript AVL Tree by Daniel Imms](https://github.com/gwtw/ts-avl-tree) (MIT License)

	This is utilized in `src/common/avl-tree.ts` and its accompany tests were ported into `__tests__/avl-tree.test.ts`. For the purposes of Play, I added an additional tree search function named `findLowerBound` to find the highest key that is less than or equal to the specified one.

Play would not be possible without the following resources:

- *[Writing an Interpreter in Go](https://www.amazon.com/Writing-Interpreter-Go-Thorsten-Ball/dp/3982016118/)* by Thorsten Ball
- *[Writing a Compiler in Go](https://www.amazon.com/Writing-Compiler-Go-Thorsten-Ball/dp/398201610X/)* by Thorsten Ball
- *[Compilers: Principles, Techniques, and Tools](https://www.amazon.com/Compilers-Principles-Techniques-Alfred-Aho/dp/0201100886/)* by Alfred V. Aho, Ravi Sethi, and Jeffrey D. Ullman (The Dragon Book—both editions were consulted, but the first was more useful for type checking)
- *[Modern Compiler Implementation in Java](https://www.amazon.com/Modern-Compiler-Implementation-Andrew-Appel/dp/052182060X)* by Andrew W. Appel
- *[Crafting Interpreters](https://craftinginterpreters.com/)* by Bob Nystrom
- *[Pratt Parsing: Expression Parsing Made Easy](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/)* by Bob Nystrom
- *[Lecture 7: Type Checking](http://www.cse.chalmers.se/edu/year/2015/course/DAT150/lectures/proglang-07.html)* by Aarne Ranta
- *[Copying Garbage Collection](https://www.cs.cornell.edu/courses/cs312/2003fa/lectures/sec24.htm)*
- *[Incremental Garbage Collection I](https://pdfs.semanticscholar.org/df04/221d00a5cca903f59f33c06992bedc1d0ba5.pdf)* by Christian Wirth