import { TypeChecker } from "./type-checker";

/** Represents a type that can be directly type-checked */
export interface TypeCheckable {
	/**
	 * True if the expression can be used as a left-hand side expression
	 *
	 * (i.e., `++5` is not legal, but `++someId` is, provided `someId` is a
	 * reference to a number variable)
	 */
	readonly isAddressable: boolean;

	/**
	 * Expression nodes should implement this to validate child node(s) type or
	 * other semantic properties
	 *
	 * May call `report` on the type checker to report other semantic errors
	 *
	 * @param tc The type checker that is requesting the check
	 * Providing the type checker also allows the node to reference the
	 * symbol table and action table (both of which are properties of the AST)
	 * since they are only available after parsing completes (which happens
	 * before type checking)
	 */
	validate(tc: TypeChecker): void;
}
