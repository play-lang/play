/**
 * Mapping of escape sequences to ascii characters for ascii control codes
 *
 * Each character is mapped to the decimal number for the control code
 * character that it represents.
 *
 * For more information, see the following page which describes control codes:
 * http://jkorpela.fi/chars/c0.html
 */
export const stringEscapes: { [key: string]: number } = {
	b: 8,
	n: 10,
	t: 9,
	r: 13,
	v: 11,
	f: 12,
	"\\": 92,
	'"': 34,
	A: 1,
	B: 2,
	C: 3,
	D: 4,
	E: 5,
	F: 6,
	G: 7,
	H: 8,
	I: 9,
	J: 10,
	K: 11,
	L: 12,
	M: 13,
	N: 14,
	O: 15,
	P: 16,
	Q: 17,
	R: 18,
	S: 19,
	T: 20,
	U: 21,
	V: 22,
	W: 23,
	X: 24,
	Y: 25,
	Z: 26,
	"[": 27,
	"|": 28, // In bash the escape is \\ for file separator control code
	"]": 29,
	"^": 30,
	_: 31,
};
