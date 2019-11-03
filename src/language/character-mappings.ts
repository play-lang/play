/** Whether the specified code point is a digit between 0 and 9 */
export function isDigit(cp: number): boolean {
	return cp >= 0x30 && cp <= 0x39;
}

const whitespace: Set<number> = new Set<number>([
	0x0000,
	0x0009,
	0x000b,
	0x000c,
	0x0020,
]);

/**
 * Whether or not the specified code point is a whitespace character
 *
 * Does not include line break characters
 */
export function isWhitespace(cp: number): boolean {
	return whitespace.has(cp);
}

const idStartChars: Set<number> = new Set<number>([
	0x00a8,
	0x00aa,
	0x00ad,
	0x00af,
	0x2054,
]);

/**
 * Check to see if the specified character codepoint is valid for an
 * identifier start
 * Uses the same identifer start characters as the Swift programming language
 *
 */
export function isValidIdStart(cp: number): boolean {
	return (
		(cp > 0x40 && cp < 0x5b) || // A-Z
		(cp > 0x60 && cp < 0x7b) || // a-z
		cp === 0x5f || // underscore
		idStartChars.has(cp) ||
		(cp >= 0x00b2 && cp <= 0x00b5) ||
		(cp >= 0x00b7 && cp <= 0x00ba) ||
		(cp >= 0x00bc && cp <= 0x00be) ||
		(cp >= 0x00c0 && cp <= 0x00d6) ||
		(cp >= 0x00d8 && cp <= 0x00f6) ||
		(cp >= 0x00f8 && cp <= 0x00ff) ||
		(cp >= 0x0100 && cp <= 0x02ff) ||
		(cp >= 0x0370 && cp <= 0x167f) ||
		(cp >= 0x1681 && cp <= 0x180d) ||
		(cp >= 0x180f && cp <= 0x1dbf) ||
		(cp >= 0x1e00 && cp <= 0x1fff) ||
		(cp >= 0x200b && cp <= 0x200d) ||
		(cp >= 0x202a && cp <= 0x202e) ||
		(cp >= 0x203f && cp <= 0x2040) ||
		(cp >= 0x2060 && cp <= 0x206f) ||
		(cp >= 0x2070 && cp <= 0x20cf) ||
		(cp >= 0x2100 && cp <= 0x218f) ||
		(cp >= 0x2460 && cp <= 0x24ff) ||
		(cp >= 0x2776 && cp <= 0x2793) ||
		(cp >= 0x2c00 && cp <= 0x2dff) ||
		(cp >= 0x2e80 && cp <= 0x2fff) ||
		(cp >= 0x3004 && cp <= 0x3007) ||
		(cp >= 0x3021 && cp <= 0x302f) ||
		(cp >= 0x3031 && cp <= 0x303f) ||
		(cp >= 0x3040 && cp <= 0xd7ff) ||
		(cp >= 0xf900 && cp <= 0xfd3d) ||
		(cp >= 0xfd40 && cp <= 0xfdcf) ||
		(cp >= 0xfdf0 && cp <= 0xfe1f) ||
		(cp >= 0xfe30 && cp <= 0xfe44) ||
		(cp >= 0xfe47 && cp <= 0xfffd) ||
		(cp >= 0x10000 && cp <= 0x1fffd) ||
		(cp >= 0x20000 && cp <= 0x2fffd) ||
		(cp >= 0x30000 && cp <= 0x3fffd) ||
		(cp >= 0x40000 && cp <= 0x4fffd) ||
		(cp >= 0x50000 && cp <= 0x5fffd) ||
		(cp >= 0x60000 && cp <= 0x6fffd) ||
		(cp >= 0x70000 && cp <= 0x7fffd) ||
		(cp >= 0x80000 && cp <= 0x8fffd) ||
		(cp >= 0x90000 && cp <= 0x9fffd) ||
		(cp >= 0xa0000 && cp <= 0xafffd) ||
		(cp >= 0xb0000 && cp <= 0xbfffd) ||
		(cp >= 0xc0000 && cp <= 0xcfffd) ||
		(cp >= 0xd0000 && cp <= 0xdfffd) ||
		(cp >= 0xe0000 && cp <= 0xefffd)
	);
}

/** True if the specified code point is a valid id character */
export function isValidIdChar(cp: number): boolean {
	return isDigit(cp) || isValidIdStart(cp);
}
