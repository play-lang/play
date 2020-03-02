import { Expression } from "src/language/node";
import { Type } from "src/language/types/type-system";

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
