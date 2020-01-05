# Play
A statically typed programming language with type synthesis including a preprocessor, type-checker, bytecode compiler, disassembler, and virtual machine which can be easily embedded in TypeScript/JavaScript environments with easy-to-use extensibility API's.

*Play has zero production dependencies* and all of its various components are written in TypeScript, with a large amount of test coverage provided using simple [Jest](https://jestjs.io/) tests.

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

### Coding Style

Play code is designed to be as easy to read as possible and uses as much academic terminology in the code as possible when implementing programming language features/algorithms to make the barrier-to-entry as low as possible.

Play code is relatively performant and this is achieved by being mindful of time complexity and picking appropriate data structures.

For example, instead of  looping through a table of files to find which file a character originates in every time a character is scanned, the lexer reads the start index of files in an [AVL Tree](https://en.wikipedia.org/wiki/AVL_tree) and is able to very quickly determine which file a token began in when given a preprocessed file.

The author has no formal background in programming languages (took a single class in college and self taught past that) so there may be discrepancies throughout the code base.

## Credits

Play would not be possible without the following resources
- *[Writing an Interpreter in Go](https://www.amazon.com/Writing-Interpreter-Go-Thorsten-Ball/dp/3982016118/)* by Thorsten Ball
- *[Writing a Compiler in Go](https://www.amazon.com/Writing-Compiler-Go-Thorsten-Ball/dp/398201610X/)* by Thorsten Ball
- *Compilers: Principles, Techniques, and Tools* by Alfred V. Aho, Ravi Sethi, and Jeffrey D. Ullman (The Dragon Book—both editions were consulted, but the first was more useful for type checking)
- *[Modern Compiler Implementation in Java](https://www.amazon.com/Modern-Compiler-Implementation-Andrew-Appel/dp/052182060X)* by Andrew W. Appel
- *[Crafting Interpreters](https://craftinginterpreters.com/)* by Bob Nystrom
- *[Pratt Parsing: Expression Parsing Made Easy](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/)* by Bob Nystrom
- *[Lecture 7: Type Checking](http://www.cse.chalmers.se/edu/year/2015/course/DAT150/lectures/proglang-07.html)* by Aarne Ranta