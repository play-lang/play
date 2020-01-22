import { TokenLike } from "src/language/token";
import { Type } from "src/language/types/type-system";

/** Represents an entry in a symbol table */
export class IdentifierSymbol {
	constructor(
		/** Name of the identifier */
		public readonly name: string,
		/** Token where the identifier is declared */
		public readonly token: TokenLike,
		/** True if the identifier represents a constant */
		public readonly isImmutable: boolean,
		/** Type--to be added after parsing by the type-checker */
		public type?: Type
	) {}
}
