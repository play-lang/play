# Design Notes

### Why make a language in TypeScript/JavaScript?

JavaScript can be run on the server and in the browser. Most languages cannot be run in the browser unless they compile to JavaScript. If you want to integrate a scripting language into your front-end application, allowing your users to write JavaScript could compromise your front end, since running JavaScript in a sandbox is difficult. Also, users cannot benefit from the type information and error detection provided by a statically typed language like Play. By writing the language in JavaScript, it can be embedded in a wide variety of projects, both in the webpage and on the server.

Since Play does not support first class functions *by design* and is statically typed, it lends itself to better compile-time analysis. For developers wishing to embed a scripting language, the safety aspects and ease of extensibility for Play allow it to be embedded in even the most simple JavaScript projects.

### No dependencies!

**Play has zero production dependencies**. Only the code in the repository is required for the language to run. Play is also platform agnostic, so it doesn't know if it's running in Node or in the browser. Instead, it provides hooks for you to provide files to it for preprocessing and execution.

Play doesn't bring in any untested or insecure modules into the environment or create unneeded bloat.

### Bytecode

Play doesn't directly interpret source code. Instead, it compiles to its own kind of bytecode, similar to Java and Python. Play executes programs by using a virtual machine to run the bytecode.

By using bytecode instead of direct interpretation, Play benefits from increased performance via optimization and lower memory usage, as well as allowing "binary" executable to be shared without revealing the original source code.

Play uses a stack-based virtual machine to execute the compiled bytecode.

Those embedding Play into their project can allow unknown compiled code to run without requiring the developers to share their original code.

### Components

Play consists of several major components that hand off output to each other, each building on what the other has done

## Lexer

The lexer reads a given string character by character and runs (as expected) in `O(n)` time complexity.

As is customary for many languages, the parser "drives" the lexer by asking it to read the next token whenever it needs one.

The lexer will keep scanning if it encounters an error token until it finds a valid token or reaches the end of the file. Besides storing the current token, it also keeps a lookahead token. This allows the lexer to "coalesce" error tokens into a single error token by joining them together if subsequent tokens are unrecognized. This allows the parser to then report more meaningful errors.

The lexer is also aware of the file tokens originate in, and creates tokens that have a reference to their original source file if given the appropriate information from the preprocessor. Knowing which file a token originates in allows the lexer and parser to provide detailed error information to the end user, providing a better development experience.

The lexer will never not issue a token when `scan()` is called. Instead, it will keep returning the end-of-file (EOF) token. This keeps things simple by avoiding optional values and null/undefined checks.
	
## Parser

The parser is implemented as a recursive descent parser and runs in effectively O(n) since the grammar does not lend itself to back-tracking, which would be highly inefficient.

Expressions are parsed via Pratt parsing. In the credits, we list several sources that explain Pratt parsing which were invaluable in the construction of this language.

Pratt parsing effectively allows parsing extremely "complicated" operators (like postfix, ternary conditional, and infix operators) and their operands to be parsed almost as easily as writing normal recursive-descent routines, and meshes with the existing parsing logic perfectly.

These expression subroutines are abstracted away in `src/language/operator-grammar` and located in `src/parser/parselet`.

The parser is responsible for generating an abstract syntax tree. The data structure for the tree contains the root node, which is always a program node, a symbol table constructed while parsing, and a table that maps function names to information about those functions.

## Type Checker

The type checker visits the AST nodes and verifies that the program is correct by checking types (as its name implies) and searching for other easy-to-detect errors, such as unreachable code or expressions that will always evaluate to true or false.

The type checker uses the structural equivalence algorithm specified in the first edition of the Dragon Book for Compilers. Types are considered equivalent if their subtrees represent the same types. Because the types in Play are relatively simple, the type checker is itself trivial.

The type checker supports *type synthesis*, the ability to infer a variable's type from the assigned expression instead of specifying a type annotation, as in the example below:

```play
let someStr = "Hello, " + "world."
```

Whereas specifying the type annotation simply makes the code longer:

```play
let someStr: str = "Hello, " + "world."
```

## Preprocessor

The preprocessor is technically a type of parser. It is responsible for creating a single, combined output string by reading files and including all of the referenced files inside those files. Each file is guaranteed to be included only once.

Files are included in play by writing the following preprocessor statement:

```play
#include "filename.play"
```

The host of the language is responsible for giving the preprocessor the appropriate function callbacks for reconciling file paths and fetching file contents. Once given those, the preprocessor is able to chain the files together and return the final string.

The preprocessor utilizes an AVL Tree (a type of balanced binary tree) for tracking where each file starts in the final combined output string. Each file's start position in the string is saved as a key in the AVL Tree and mapped to the source file it represents. This allows the lexer to figure out which file a token originated in while scanning the combined string in O(log(N)) time.

## Compiler

The compiler is responsible for walking the abstract syntax tree produced by the parser and producing the bytecode that runs the program. It is implemented as a single pass compiler that produces bytecode for a stack-based virtual machine.

The compiler actually produces multiple *contexts* which hold bytecode and a single, shared *constant pool* which contains the literal values referenced in the bytecode contexts. A context is produced for each function that is compiled as well as the main scope (which consists of the code outside any functions).

The compiler, upon successful compilation, creates an object that contains a list of compiled contexts, a constant pool, the number of globals in the main scope, and an address resolver which contains information about bytecode addresses inside the compiled bytecode contexts that need to be "patched" or "resolved" by the linker after all the bytecode in the contexts has been chained together into one single array of bytecode.

## Linker

The linker is responsible for taking the compiled bytecode objects from the compiler and chaining them together to create a single sequence of bytecode that represents the user's program.

To properly sequence the code together, the linker must resolve bytecode addresses in the contexts that refer to bytecode later in its own context or in other contexts. The linker is provided this information by the output of the compiler which includes the address resolver containing the table of addresses referred to by the bytecode in the contexts.

While linking the context bytecode arrays together, the linker constructs a *context map* which maps the name of the context to the numeric offset in the final bytecode where the context's bytecode first starts.

Once all the bytecode has been linked together into one array of bytecode, the context map is given to the address resolver so that it can resolve the addresses in the final bytecode.

The linker, if successful, produces an object containing the list of contexts, the context map, and a loaded program object which itself consists of a constant pool, the combined bytecode, and the number of variables in the main scope.

## Assembler

The assembler takes the compiled objects from the compiler and resolves the addresses and labels contained inside by replacing labels with actual bytecode addresses and patching the jump and call statements as necessary.

## Disassembler

## Virtual Machine
