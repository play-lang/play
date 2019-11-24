/**
 * Template string tag to remove leading whitespace in lines when
 * template strings are represented in code with leading indentation
 * @param strings Template string input
 */
export function str(strings: TemplateStringsArray): string {
	// From: https://muffinresearch.co.uk/removing-leading-whitespace-in-es6-template-strings/
	const values = Array.prototype.slice.call(arguments, 1);
	let output = "";
	for (let i = 0; i < values.length; i++) {
		output += strings[i] + values[i];
	}
	output += strings[values.length];

	// Split on newlines.
	const lines = output.split(/(?:\r\n|\n|\r)/);

	// Rip out the leading whitespace.
	return lines
		.map(line => {
			return line.replace(/^\s+/gm, "");
		})
		.join(" ")
		.trim();
}
