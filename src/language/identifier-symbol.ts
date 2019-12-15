import { TokenLike } from "./token";
import { Type } from "./types/type-system";

/** Represents an entry in a symbol table */
export interface IdentifierSymbol {
	/** Name of the identifier */
	name: string;
	/** Token where the identifier is declared */
	token: TokenLike;
	/** True if the identifier represents a constant */
	isImmutable: boolean;
	/** Type--to be added after parsing by the type-checker */
	type?: Type;
}
