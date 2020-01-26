/**
 * State passed around recursively in the type checker
 */
export class CheckState {
	constructor(
		/** Name of the current function */
		public readonly functionName: string,
		/** Current code path is unreachable */
		public readonly isUnreachable: boolean
	) {}
}
