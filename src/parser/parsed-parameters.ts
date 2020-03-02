import { TokenLike } from "src/language/token";

/** Contains data about a parsed parameter sequence like `a: num, b: str` */
export class ParsedParameters {
	constructor(
		/** Parameter type annotations */
		public readonly types: Map<string, string[]> = new Map(),
		/** Parameter names */
		public readonly names: string[] = [],
		/** Parameter tokens */
		public readonly tokens: TokenLike[] = []
	) {}
}
