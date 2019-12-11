/**
 * Holds information about a parsed function
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
		public readonly parameterTypes: Map<string, string[]>
	) {}
}
