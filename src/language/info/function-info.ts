import { FunctionType } from "src/language/types/type-system";

/**
 * Holds information about a parsed function.
 * This is an intermediate data structure that is used to construct function
 * types once parsing is complete.
 */
export class FunctionInfo {
	constructor(
		/** Name (string id) of the function */
		public readonly name: string,
		/** Return type of the function */
		public readonly typeAnnotation: string[],
		/** Parameter names list */
		public readonly parameters: string[],
		/** Parameter names mapped to parameter type annotations */
		public readonly parameterTypes: Map<string, string[]>,
		/** Function type, determined after parsing by the type checker */
		public type?: FunctionType
	) {}
}
