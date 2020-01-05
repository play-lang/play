# Play
A statically typed programming language with type synthesis including a preprocessor, type-checker, bytecode compiler, disassembler, and virtual machine which can be easily embedded in TypeScript/JavaScript environments with easy-to-use extensibility API's.

*Play has zero production dependencies* and all of its various components are written in TypeScript, with a large amount of test coverage provided using simple [Jest](https://jestjs.io/) tests.

## Contributing

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