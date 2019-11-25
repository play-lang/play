/**
 * Holds information about a parsed action
 */
export class ActionInfo {
	constructor(
		/** Name of the action */
		public readonly name: string,
		/** Type of the action */
		public readonly typeAnnotation: string[],
		/** Number of parameters expected by this action */
		public readonly numParameters: number,
		/** Parameter names mapped to parameter type annotations */
		public readonly parameters: Map<string, string[]>
	) {}
}
