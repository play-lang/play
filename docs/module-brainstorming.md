Type compatibility for models will be strictly named.
Type introspection will be available. Object instances will contain a string value with the name of the class they implement (VM can resolve name conflicts between modules at runtime). These values can then be looked up in the main module and supporting modules at runtime to determine object conformance

Steps:

Parse models and protocols
	- Ensure models and protocols do not have fields with the same name
Type-check models:
	- Ensure models actually implement properties from implemented protocols

model Compiler {
	let source: String

	get code: String {

	}

	set code: String {

	}

	function action() {}
}

model CodeManipulator {
	function action() {}
}

model TypeChecker {
	has compiler: Compiler
	has manipulator: CodeManipulator

	// Conflict: action() is defined for compiler and manipulator
	// and thus not accessible here
	function action() {
		if (condition) compiler.action() else manipulator.action() 
	}
}

A compiled play module might look like the following:

```json
{
	"name": "my-module",
	"imports": {
		"my-other-module": {
			"conflictingClassName": "newName"
		}
	},
	"symbols": {
		"a": {
			"type": "bool"
		},
		"Magical": {
			"type": "protocol",
			"conforms": [],
			"fields": {
				"power": {
					"type": "num",
					"index": 0
				}
			}
		},
		"Wizard": {
			"type": "model",
			"implements": [
				"Magical"
			],
			"fields": {
				"power": {
					"type": "num",
					"index": 0,
				},
				"companion": {
					"type": "Wizard"
				}
			}
		}
	},
	"constants": [
		100,
		"hello, world!",
		true,
		null,
		false,
		"hi"
	],
	"code": [
		10, 5, 31, 20, 10
	]
}
```

```play
// app.play module

import "lib/bird.play"
import "lib/music.play"

// Create a class with the same name as an imported module
model Bird {
	// Implement external interface
	implements BirdLike
	let id: str
	let age: number
	let song: str
}

let bird = new Bird
bird.song = "row row row your boat"

// Invoke external method
sing(bird)

// lib/bird.play module

model Bird {
	implements BirdLike
	let name: str
	let song: str
}

protocol BirdLike {
	let song: str
}

// lib/music.play module
import "bird.play"

function sing(bird: Bird) {
	print(bird.song)
} 
```