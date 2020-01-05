# Play
A programming language and virtual machine which can be easily embedded in TypeScript/JavaScript environments with easy extensibility API's.

Play has zero production dependencies and all of its various components are written in TypeScript, with a large amount of test coverage using [Jest](https://jestjs.io/).

## Contributing

The project is designed to be edited in VSCode.

Clone the project:

```sh
git clone git@github.com:josephessin/play.git
```

Install development dependencies:

```sh
npm install
```

Code can be automatically formatted if you have the [TSLint extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin) installed in VSCode. You will get this functionality for free since [Prettier](https://prettier.io/) is installed locally and configured as a TSLint plugin.

Now that you're setup, you might want to run some tests:

```sh
npm run test
```

To see test coverage:

```sh
npm run coverage
```

Or build the project:

```sh
npm run build
```

You can see all of the commands available in the `package.json` file.