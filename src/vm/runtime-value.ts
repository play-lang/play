export enum RuntimeType {
	Number = 1,
	String,
	Boolean,
	Object,
}

export class RuntimeValue {
	constructor(public readonly type: RuntimeType, public readonly value: any) {}
}
