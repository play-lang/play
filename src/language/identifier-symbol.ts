import { TokenLike } from "./token";

/** Represents an entry in a symbol table */
export interface IdentifierSymbol {
	name: string;
	token: TokenLike;
	typeAnnotation: string[];
	isImmutable: boolean;
}
