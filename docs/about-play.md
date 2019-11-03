# Introduction to Playtime

Thanks for choosing to learn Playtime: we know that studying a new programming language can be challenging at times and we hope you'll find it as enjoyable as we do. With any luck, this guide will be able to take you from a novice to a master in no time!

Don't worry if you don't understand every concept right away. By fiddling with the code examples and doing some supplementary googling, you'll be programming in no time at all. Of course, if you get stuck you are always welcome to reach out to us.

Some concepts take more time to understand than others. If you find yourself struggling with one concept, keep reading anyways! Very often, you'll find it re-explained later on in a different context that makes more sense.

Programming lessons are sometimes guilty of asking the reader to know more than she really needs to learn something, so we try to make it as easy as possible to keep going.

## What is Playtime exactly?

Technically speaking, playtime is a general-purpose, extensible, statically typed language written in TypeScript that aims to provide an easy-to-use and extensible core language.

Playtime is implemented as a single-pass lexer and parser that constructs an abstract syntax tree (AST). Type-checking, static analysis, and compilation happen on their own respective passes as needed. The play compiler converts the AST to a represenation that evokes traditional "bytecode" for speedier execution.

The Playtime parser is a recursive-descent top-down parser that uses a single look-ahead. Expressions are parsed via the shunting-yard algorithm which allows Playtime to support a wide variety of commonly used operators found in other languages.

*Don't worry if you didn't understand any of that—we hope you find that the real joy is in actually using Playtime, not reading about its internals.*

## Operator Precedence

Grouping operators such as list subscription `[]` and parenthesis `()` are not shown.

Below, each operator is shown with its relevant precedence level (bigger numbers indicate higher precedence), associativity, and arity (the number of operands the operator requires).

| Operator          | Prec. | Associativity | Arity   | Function               |
|-------------------|-------|---------------|---------|------------------------|
| `.`               | 14    | left-to-right | binary  | Member access          |
| `... --`          | 13    | n/a           | unary   | Postfix decrement      |
| `... ++`          | 13    | n/a           | unary   | Postfix increment      |
| `! ...`           | 12    | right-to-left | unary   | Logical not            |
| `++ ...`          | 12    | right-to-left | unary   | Prefix increment       |
| `-- ...`          | 12    | right-to-left | unary   | Prefix decrement       |
| `... ^ ...`       | 11    | right-to-left | binary  | Exponentiation         |
| `+ ...`           | 10    | right-to-left | unary   | Unary plus             |
| `- ...`           | 10    | right-to-left | unary   | Unary negation         |
| `... % ...`       | 9     | left-to-right | binary  | Modulus                |
| `... / ...`       | 9     | left-to-right | binary  | Division               |
| `... * ...`       | 9     | left-to-right | binary  | Multiplication         |
| `... - ...`       | 8     | left-to-right | binary  | Subtraction            |
| `... + ...`       | 8     | left-to-right | binary  | Addition               |
| `a in b `         | 7     | left-to-right | binary  | map membership         |
| `a is b `         | 7     | left-to-right | binary  | instance of thing      |
| `a uses b `       | 7     | left-to-right | binary  | implements interface   |
| `... <= ...`      | 7     | left-to-right | binary  | Less than or equal     |
| `... >= ...`      | 7     | left-to-right | binary  | Greater than or equal  |
| `... < ...`       | 7     | left-to-right | binary  | Less than              |
| `... > ...`       | 7     | left-to-right | binary  | Greater than           |
| `... == ...`      | 6     | left-to-right | binary  | Equality               |
| `... != ...`      | 6     | left-to-right | binary  | Inequality             |
| `... and ...`     | 5     | left-to-right | binary  | Logical and            |
| `... or ...`      | 4     | left-to-right | binary  | Logical or             |
| `... ? ... : ...` | 3     | right-to-left | ternary | Conditional            |
| `... = ...`       | 2     | right-to-left | binary  | Assignment             |
| `... += ...`      | 2     | right-to-left | binary  | Addition assignment    |
| `... -= ...`      | 2     | right-to-left | binary  | Subtraction assignment |
| `... *= ...`      | 2     | right-to-left | binary  | Mult. assignment       |
| `... %= ...`      | 2     | right-to-left | binary  | Modulus assignment     |
| `... /= ...`      | 2     | right-to-left | binary  | Division assignment    |
| `... , ...`       | 1     | left-to-right | binary  | Comma                  |

## Overview of the Language

The following section provides an at-a-glance overview of Playtime by showing code samples. For the in-depth language specification, see the rest of the guide.

### Declaring Variables

To make what we're about to talk about easier to understand, let's start off by defining a few new terms:

A `variable` is a name for something that holds a value of a particular type. Think `x` in algebra—it's used to represent an unknown number. If you didn't like math much, don't worry. Programming is actually much easier than math because it is very self-descriptive.

Variables in Playtime are `declared` by writing the type of the variable first, followed by the name of the variable, an equals `=` sign, and an `expression` that computes the value of the variable. This tells Playtime that you want to keep track of what could be an unknown value later on.

Here's an example of some variables being declared in Playtime (don't worry if you don't know what everything is just yet):

```play
num myNumber = 101
str myString = "Hello, world"
```

Unlike in algebra, most programming languages like Playtime let variable names be more than one letter long. Names like `speed`, `hitPoints`, or `hours` are all great variable names. It's also important to know that variable names can't contain spaces or symbols like `+` and `*`.

The convention is to make the first word lowercase for longer variable names that are made out of multiple words. Any subsequent words in the name have their first letter capitalized, like `numDogsInThePark` or `buildingHeight`. This naming convention is called [lower-camel-case](https://en.wikipedia.org/wiki/Camel_case), like the humps in a camel's back (programmers are not always this creative).

A `primitive` data type is a very simple type of data that is built in to the programming language itself. In Play, we have two primitive types: numbers and strings, abbreviated to the names `num` and `str`, respectively. To be able to store a value in a variable, Playtime has to know what kind of value you want to store.

Numbers can represent integers or decimal numbers, and strings represent text. Strings are made of `characters` such as `a`, `l`, and `P`. Even numbers and symbols like `$` or `3` are considered characters. In fact, anything that can be typed counts as a character (including emoji! 😌)

Instead of referring directly to a value, we can refer to it by its name in case its value is changed later.

**Note:** *There's absolutely no connection between a variable's name and the type of data it can have or the value that it represents*. You can name a variable whatever you want, or make the name total gibberish like `aasdfhg`. When other programmers read your code, however, they will mean things about you if you don't give your variables relevant names. Sometimes, picking a good name for what you're trying to represent can be the hardest part of programming.

An `expression` represents a computed value like `(a + b) * 3`. An expression can typically go anywhere a single value would ordinarily go, like in the examples below:

```play
	num a = 5 * 4 + (30318 - 38)
	num b = 20 + 3
	if (a + b) < 50 {
		print "Smaller than 50!"
	}
```

Don't worry—we haven't actually talked about the `if` or `print` commands yet, although you can probably figure out what's happening here.

Variables can be given a different value after they have been declared:

```play
num myNumber = 10
... (later on in your code) ...
myNumber = 105
```

#### Primitive Types

Like we mentioned earlier, Playtime has two primitive types: numbers and strings. 

Numbers represent a numeric value like `1`, `501.31` or even a number expressed in scientific notation like `1.3e10` which means "1.3 x 10 to the 3rd power" (the `e` stands for Exponent and can be uppercase `E` or lowercase `e`). The number that follows the `e` is the exponent applied to 10.

For strings, computers use an internal table to know which character code numbers go with which character pictures used in fonts. The old system was called [ASCII](https://www.ascii-code.com), which was later expanded to form [Unicode](https://unicode.org/standard/WhatIsUnicode.html). You can read all about it [here](https://medium.com/@apiltamang/unicode-utf-8-and-ascii-encodings-made-easy-5bfbe3a1c45a) if you really want to understand more of the details, although it isn't essential.

Internally, the computer represents each character as a special number code. To store more than one character, the computer stores a sequence of characters in a list inside it's working memory.

#### Comments

Playtime allows you to write notes to yourself. Leaving comments in your code is a great way to explain tricky sections of code that you might forget about later on when you're trying to figure out why your code isn't doing what you think it should be doing.

Comments don't do anything other than inform you. Playtime simply discards them internally when it runs your program.

To write a single-line comment that ends with the end of the line, use a double forward slash like this:

```play
// This is a comment!
num dogs = 10 // Declare a variable called dogs with a value of 10 
num cats = 5
```

The code part, `num dogs = 10` will cause Playtime to create a new variable called `dogs` and give it the specified value. The comment immediately following it on the same line will be discarded. The next line that declares a variable for `cats` will then be executed, as if the comment had never existed.

#### Strings

String `literals` can be declared with two quote styles: double-quotes `"` and back-ticks `` ` ``.

A `literal` is an actual value typed in the code like `1581.31` or `"hello, reader"`. There are literals for all different kinds of values, like `string literals` and `numeric literals`.

String literals can be combined (called `concatenation`) with the `+` operator:

```play
str greeting = "Hello, " + "Joe"
```

Greeting now equals the combined string `Hello, Joe`. Note that we added a space to the `"Hello, "` string literal so that the name wasn't squished up against it when we combined them.

Strings support `escape sequences` that allow specialty characters to be displayed inside the string that would otherwise look weird or not be possible to write in the code.

For strings created with double-quote literals the following escape sequences apply:

| Escape sequence | Description               |
|-----------------|---------------------------|
| \b              | Backspace character       |
| \n              | New-line character        |
| \t              | Tab character             |
| \r              | Carriage-return character |
| \v              | Vertical tab character    |
| \f              | Form-feed character       |

```play
str text = "\tHello, world!\n"
```

When that text is displayed on screen, it will be indented by one tab and have a new-line character following it.

Since Play is strongly typed, the `expression` must produce a value that has the same type of the variable it is assigned to.

