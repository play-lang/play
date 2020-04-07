import { Expression } from "src/language/node";
import { Type } from "src/language/types/type-system";

/**
 * Holds information about parsed model properties. This is an intermediate data
 * structure that is used to hold property information until type construction
 * can occur after parsing.
 */
export class PropertyInfo {
	constructor(
		/** Name of the property */
		public readonly name: string,
		/** Type annotation */
		public readonly typeAnnotation: string[],
		/** True if the property is immutable */
		public readonly isImmutable: boolean,
		/** Default value, if any */
		public readonly defaultValue?: Expression,
		/** Type (computed later by type-checker) */
		public readonly type?: Type
	) {}
}
