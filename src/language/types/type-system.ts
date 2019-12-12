import { LinkedHashMap } from "../../common/linked-hash-map";
import { FunctionInfo } from "../function-info";
import { Describable } from "../token";

/**
 * Primitive types that can be represented with an instance of a PrimitiveType
 */
export enum Primitive {
	Void,
	Bool,
	Num,
	Str,
}

/**
 * Collection types that can be represented with type constructors
 */
export enum Collection {
	List = 1,
	Map,
	Set,
}

export abstract class Type implements Describable {
	constructor(
		/**
		 * True if the type is addressable and assignable
		 *
		 * Some addressable types, like constants, cannot be assigned to
		 * This basically informs us of l-values in assignment expressions
		 */
		public readonly isAssignable: boolean
	) {}

	/**
	 * Type subclasses should implement this to determine equivalence for a
	 * specified type
	 *
	 * @param type The comparison type
	 * @returns True if the specified type is equivalent to the receiver, false
	 * otherwise
	 */
	public abstract equivalent(type: Type): boolean;

	// MARK: Describable
	public abstract get description(): string;
}

/** Represents an error type */
export class ErrorType extends Type {
	constructor(isAssignable: boolean) {
		super(isAssignable);
	}

	public equivalent(type: Type): boolean {
		return type === this || type instanceof ErrorType;
	}

	public get description(): string {
		return (this.isAssignable ? "&" : "") + "ErrorType";
	}
}

/**
 * Basic type
 *
 * All other types are built upon this basic type
 */
export class PrimitiveType extends Type {
	constructor(
		/** The data type primitive represented by this type */
		public readonly primitive: Primitive,
		isAssignable: boolean
	) {
		super(isAssignable);
	}

	public equivalent(type: Type): boolean {
		return (
			type === this ||
			(type instanceof PrimitiveType && type.primitive === this.primitive)
		);
	}

	public get description(): string {
		return (this.isAssignable ? "&" : "") + Primitive[this.primitive];
	}
}

/**
 * A record of types is a named type tuple: equivalence to another record
 * requires that both records have the same number of types with the same
 * names in the same order
 *
 * The "operands" of the record are types, and the structure of a record
 * type is determined by the fixed order of the operands in the record
 *
 * This record type ensures equivalence between another record type by
 * checking that its parameters have the same name, occur in the same order,
 * and have the same types
 *
 * https://en.wikipedia.org/wiki/Product_type
 *
 *
 * This aligns more with the Dragon book's definition of a record
 * type (first edition, p. 345)
 */
export class RecordType extends Type {
	constructor(
		/** The type operands for this record type keyed by the name */
		public readonly operands: LinkedHashMap<string, Type>,
		isAssignable: boolean = false
	) {
		super(isAssignable);
	}

	public equivalent(type: Type): boolean {
		if (type === this) return true;
		if (!(type instanceof RecordType)) return false;
		if (type.operands.size !== this.operands.size) return false;
		for (const name of type.operands.keys()) {
			// Ensure that we also have a parameter with the same name
			if (!this.operands.has(name)) return false;
			// Ensure that our parameter with the same name occurs at the same
			// ordinal position
			if (this.operands.ordinal(name)! !== type.operands.ordinal(name)!) {
				return false;
			}
			// Lastly, ensure that the parameter types match
			if (!this.operands.get(name)!.equivalent(type.operands.get(name)!)) {
				return false;
			}
		}
		return true;
	}

	public get description(): string {
		return (
			(this.isAssignable ? "&" : "") +
			"<" +
			Array.from(this.operands)
				.map(operand => operand[0] + ": " + operand[1].description)
				.join(", ") +
			">"
		);
	}
}

/**
 * A product of types represents an ordered list of unnamed types, as opposed
 * to a RecordType which is an ordered list of named types
 *
 * Equivalence between two product types is determined by checking that
 * both product types have the same number of operands with the same types
 * in the same order
 */
export class ProductType extends Type {
	constructor(
		/** The type operands for this product type */
		public readonly operands: Type[],
		isAssignable: boolean = false
	) {
		super(isAssignable);
	}

	public equivalent(type: Type): boolean {
		if (type === this) return true;
		if (!(type instanceof ProductType)) return false;
		if (type.operands.length !== this.operands.length) return false;
		for (let i = 0; i < this.operands.length; i++) {
			if (!this.operands[i].equivalent(type.operands[i])) return false;
		}
		return true;
	}

	/**
	 * Checks to see if this product type contains the same number of types and
	 * the same ordering as another record type
	 *
	 * While product and record types are considered nonequivalent, a record type
	 * is able to be satisfied by an appropriate product type for function
	 * invocation
	 *
	 * @param type The record type to consider
	 */
	public satisfiesRecordType(type: RecordType): boolean {
		// A product cannot satisfy a record if the lengths are different
		if (type.operands.size !== this.operands.length) return false;
		let i = 0;
		for (const name of type.operands.keys()) {
			const lhsType = this.operands[i];
			const rhsType = type.operands.get(name)!;
			if (!lhsType.equivalent(rhsType)) return false;
			i++;
		}
		return true;
	}

	public get description(): string {
		return (
			(this.isAssignable ? "&" : "") +
			"<" +
			Array.from(this.operands)
				.map(operand => operand.description)
				.join(", ") +
			">"
		);
	}
}

/**
 * Represents a function type, which consists of a domain type for
 * the parameters (a product type containing multiple types) and a type
 * for the range (return value)
 */
export class FunctionType extends Type {
	constructor(
		/** Name of the function */
		public readonly name: string,
		/** Function parameters (domain) type */
		public readonly parameters: RecordType,
		/** Return value type (range type) */
		public readonly returnType: Type
	) {
		super(false);
	}

	public equivalent(type: Type): boolean {
		return (
			type === this ||
			(type instanceof FunctionType &&
				this.name === type.name &&
				this.parameters.equivalent(type.parameters))
		);
	}

	public get description(): string {
		return (
			"(" +
			this.name +
			"(" +
			Array.from(this.parameters.operands.values())
				.map(operand => operand.description)
				.join(", ") +
			")" +
			" -> " +
			this.returnType.description +
			")"
		);
	}
}

export class CollectionType extends Type {
	constructor(
		/** The type of collection being represented by this instance */
		public readonly collection: Collection,
		/** Type of the elements to be stored in the list */
		public readonly elementType: Type,
		isAssignable: boolean = false
	) {
		super(isAssignable);
	}

	public equivalent(type: Type): boolean {
		return (
			type === this ||
			(type instanceof CollectionType &&
				this.collection === type.collection &&
				this.elementType.equivalent(type.elementType))
		);
	}

	public get description(): string {
		return (
			(this.isAssignable ? "&" : "") +
			Collection[this.collection] +
			"<" +
			this.elementType.description +
			">"
		);
	}
}

/** Void type, for your convenience */
export const Void = new PrimitiveType(Primitive.Void, false);
export const Bool = new PrimitiveType(Primitive.Bool, false);
export const Num = new PrimitiveType(Primitive.Num, false);
export const Str = new PrimitiveType(Primitive.Str, false);

/**
 * Construct a type instance from the specified type annotation array
 *
 * @param typeAnnotation A type annotation string array
 * Examples include ["str"], ["bool"], ["Wizard"], ["str", "map"],
 * ["str", "list", "map"], ["num", "list"]
 * @param [isAssignable=false] Whether or not the type represents an entity type that
 * can be assigned to (like a mutable variable)
 */
export function constructType(
	typeAnnotation: string[],
	isAssignable: boolean = false
): Type {
	if (typeAnnotation.length < 1) {
		return new PrimitiveType(Primitive.Void, false);
	}
	let annotation = typeAnnotation[0]!;
	let type: Type;
	switch (annotation) {
		case "void":
			type = new PrimitiveType(Primitive.Void, false);
			break;
		case "str":
			type = new PrimitiveType(Primitive.Str, isAssignable);
			break;
		case "num":
			type = new PrimitiveType(Primitive.Num, isAssignable);
			break;
		case "bool":
			type = new PrimitiveType(Primitive.Bool, isAssignable);
			break;
		default:
			type = new ErrorType(isAssignable);
	}
	for (let i = 1; i < typeAnnotation.length; i++) {
		annotation = typeAnnotation[i];
		switch (annotation) {
			// Wrap the last type in the appropriate type constructor
			case "list":
				type = new CollectionType(Collection.List, type);
				break;
			case "map":
				type = new CollectionType(Collection.Map, type);
				break;
			case "set":
				type = new CollectionType(Collection.Set, type);
				break;
			default:
				type = new ErrorType(isAssignable);
		}
	}
	return type;
}

/**
 * Construct a function type for use with type checking from a function
 * information object (which comes from the parser)
 *
 * @param info Function information from the parser
 */
export function constructFunctionType(info: FunctionInfo): FunctionType {
	const parameters = new LinkedHashMap<string, Type>();
	for (const paramName of info.parameters) {
		const annotation = info.parameterTypes.get(paramName)!;
		const type = constructType(annotation);
		parameters.set(paramName, type);
	}
	const parametersType = new RecordType(parameters);
	const returnType = constructType(info.typeAnnotation);
	const type = new FunctionType(info.name, parametersType, returnType);
	return type;
}

/**
 * Determines whether or not the specified right-hand side type can be assigned
 * to the specified left-hand side type
 * @param lhs The type of the left-hand side (assignee)
 * @param rhs The type of the value being assigned
 */
export function allowAssignment(lhs: Type, rhs: Type): boolean {
	return lhs.isAssignable && lhs.equivalent(rhs);
}
