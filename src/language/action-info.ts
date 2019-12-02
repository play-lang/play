/**
 * Holds information about a parsed action
 */
export class ActionInfo {
	constructor(
		/** Name of the action */
		public readonly name: string,
		/** Type of the action */
		public readonly typeAnnotation: string[],
		/** Parameter names list */
		public readonly parameters: string[],
		/** Parameter names mapped to parameter type annotations */
		public readonly parameterTypes: Map<string, string[]>
	) {}
}
