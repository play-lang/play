export enum RuntimeType {
	String,
	Number,
	Boolean,
	Object,
}

export class RuntimeValue {
	constructor(public readonly type: RuntimeType, public readonly value: any) {}
}
