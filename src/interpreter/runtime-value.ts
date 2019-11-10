export enum RuntimeType {
	String,
	Number,
	Boolean,
}

export class RuntimeValue {
	constructor(public readonly type: RuntimeType, public readonly value: any) {}
}
