import { LinkedHashMap } from "src/common/linked-hash-map";
import { FunctionInfo } from "src/language/function-info";
import { Describable } from "src/language/token";

/**
 * Primitive types that can be represented with an instance of a PrimitiveType
 */
export enum Primitive {
	None,
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
	// MARK: Describable
	public abstract get description(): string;

	/**
	 * Construct a type instance from the specified type annotation array
	 *
	 * @param typeAnnotation A type annotation string array
	 * Examples include ["str"], ["bool"], ["Wizard"], ["str", "map"],
	 * ["str", "list", "map"], ["num", "list"]
	 * @param [isAssignable=false] Whether or not the type represents an entity type that
	 * can be assigned to (like a mutable variable)
	 */
	public static construct(
		typeAnnotation: string[] | string,
		isAssignable: boolean = false
	): Type {
		const memberAnnotations: string[][] =
			typeof typeAnnotation === "string"
				? typeAnnotation
						.split("|")
						.map(annotation => annotation.split(" "))
				: [typeAnnotation];

		const memberTypes: Type[] = [];

		for (const memberAnnotation of memberAnnotations) {
			if (memberAnnotation.length < 1) {
				return new PrimitiveType(Primitive.None, false);
			}
			let annotation = memberAnnotation[0]!;
			let type: Type;
			switch (annotation) {
				case "none":
					type = new PrimitiveType(Primitive.None, false);
					break;
				case "any":
					type = new AnyType(false);
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
			for (let i = 1; i < memberAnnotation.length; i++) {
				annotation = memberAnnotation[i];
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
			memberTypes.push(type);
		}
		if (memberTypes.length === 1) {
			// Single type to return
			return memberTypes[0];
		} else {
			// We parsed multiple types, which indicates a type union
			// (i.e., sum type)
			return new SumType(memberTypes, isAssignable);
		}
	}

	/**
	 * Construct a function type for use with type checking from a function
	 * information object (which comes from the parser)
	 *
	 * @param info Function information from the parser
	 */
	public static constructFunction(info: FunctionInfo): FunctionType {
		const parameters = new LinkedHashMap<string, Type>();
		for (const paramName of info.parameters) {
			const annotation = info.parameterTypes.get(paramName)!;
			const type = Type.construct(annotation);
			parameters.set(paramName, type);
		}
		const parametersType = new RecordType(parameters);
		const returnType = Type.construct(info.typeAnnotation);
		const type = new FunctionType(info.name, parametersType, returnType);
		return type;
	}

	public static unify(types: Type[]): void {
		return;
	}

	constructor(
		/**
		 * True if the type is addressable and assignable
		 *
		 * Some addressable types, like constants, cannot be assigned to
		 * This basically informs us of l-values in assignment expressions
		 */
		public isAssignable: boolean
	) {}

	/**
	 * *Type equivalence*, in type theory terminology determines whether
	 * two types represent the same type of things, roughly stated. That is,
	 * if two types are *equivalent* they are the same type.
	 *
	 * For any types A and B, if A is equivalent to B then B is also equivalent
	 * to A. Equivalence is symmetric (it is a two-way street).
	 *
	 * Type subclasses should implement this to determine equivalence for a
	 * specified type
	 *
	 * @param type The comparison type
	 * @returns True if the specified type is equivalent to the receiver, false
	 * otherwise
	 */
	public abstract equivalent(type: Type): boolean;

	/**
	 * Determines if the specified type can be used in place of the type
	 * represented by the receiver (represents *type compatibility* in type
	 * theory terminology))
	 *
	 * Type compatibility is not symmetric like type equivalence is. If type A
	 * can be used in place of type B, type B cannot necessarily be used in
	 * place of A.
	 *
	 * Type subclasses should implement this to determine compatibility with a
	 * specified type
	 *
	 * @param type The type to be considered as a substitute
	 *
	 * @returns True if the specified type can be used in place of the type
	 * represented by the receiver
	 */
	public abstract accepts(type: Type): boolean;

	/** Create a copy of the type */
	public abstract copy(): Type;
}

/** Represents an error type */
export class ErrorType extends Type {
	constructor(isAssignable: boolean = false) {
		super(isAssignable);
	}

	public equivalent(type: Type): boolean {
		return type instanceof ErrorType;
	}

	public accepts(type: Type): boolean {
		// Error types have a narrow definition of compatibility
		return this.equivalent(type);
	}

	public get description(): string {
		return (this.isAssignable ? "&" : "") + "ErrorType";
	}

	public copy(): ErrorType {
		return new ErrorType(this.isAssignable);
	}
}

/**
 * "Any" type
 */
export class AnyType extends Type {
	constructor(isAssignable: boolean = false) {
		super(isAssignable);
	}

	public equivalent(type: Type): boolean {
		// Only equivalent to other AnyType instances or itself:
		return type instanceof AnyType;
	}

	public accepts(type: Type): boolean {
		// Any type has a broad definition of compatibility
		// Anything that is not an error type is fair game to substitute for an
		// any type
		return !(type instanceof ErrorType);
	}

	public get description(): string {
		return (this.isAssignable ? "&" : "") + "Any";
	}

	public copy(): AnyType {
		return new AnyType(this.isAssignable);
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
		isAssignable: boolean = false
	) {
		super(isAssignable);
	}

	public equivalent(type: Type): boolean {
		return (
			type === this ||
			(type instanceof PrimitiveType && type.primitive === this.primitive)
		);
	}

	public accepts(type: Type): boolean {
		// Primitive types also have a narrow definition of compatibility
		return this.equivalent(type);
	}

	public get description(): string {
		return (this.isAssignable ? "&" : "") + Primitive[this.primitive];
	}

	public copy(): PrimitiveType {
		return new PrimitiveType(this.primitive, this.isAssignable);
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
			if (
				!this.operands.get(name)!.equivalent(type.operands.get(name)!)
			) {
				return false;
			}
		}
		return true;
	}

	public accepts(type: Type): boolean {
		// Record types also have a narrow definition of compatibility
		return this.equivalent(type);
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

	public copy(): RecordType {
		return new RecordType(
			new LinkedHashMap<string, Type>(this.operands),
			this.isAssignable
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

	public accepts(type: Type): boolean {
		// Product types also have a narrow definition of compatibility
		return this.equivalent(type);
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

	public copy(): ProductType {
		return new ProductType([...this.operands], this.isAssignable);
	}
}

/**
 * Represents a union of types, where a type can be any of the allowed
 * subtypes contained inside it.
 *
 * Comparable to a normal union (but not a tagged union)
 */
export class SumType extends Type {
	/** The allowed types contained inside this sum type */
	public readonly types: Set<Type>;
	/**
	 * Create a new sum type by specifying allowed types
	 * @param types Array of types to be included as part of this sum type
	 * @param isAssignable Whether or not the type is assignable
	 */
	constructor(types: Iterable<Type>, isAssignable: boolean = false) {
		super(isAssignable);
		this.types = new Set(types);
	}

	public equivalent(type: Type): boolean {
		if (type === this) return true;
		if (!(type instanceof SumType)) return false;
		// Empty sum types are equivalent
		// Ensure both sum types have the same number of member types
		if (this.types.size !== type.types.size) return false;
		// If every type from the receiver's set is present in the comparison
		// type, then it must be equivalent
		for (const t of this.types) {
			if (!type.types.has(t)) return false;
		}
		return true;
	}

	public accepts(type: Type): boolean {
		if (this.equivalent(type)) return true;
		// If the comparison type is equivalent to any of the receiver's member
		// types, the receiver accepts the comparison type as a substitute for
		// itself
		for (const t of this.types) {
			if (type.equivalent(t)) return true;
		}
		return false;
	}

	public get description(): string {
		return (
			(this.isAssignable ? "&" : "") +
			"<" +
			Array.from(this.types.values())
				.map(type => type.description)
				.join(" | ") +
			">"
		);
	}

	public copy(): SumType {
		return new SumType(new Set(this.types), this.isAssignable);
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

	public accepts(type: Type): boolean {
		// Function types also have a narrow definition of compatibility
		return this.equivalent(type);
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

	public copy(): FunctionType {
		return new FunctionType(
			this.name,
			this.parameters.copy(),
			this.returnType.copy()
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

	public accepts(type: Type): boolean {
		// Collection types also have a narrow definition of compatibility
		return this.equivalent(type);
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

	public copy(): Type {
		return new CollectionType(
			this.collection,
			this.elementType.copy(),
			this.isAssignable
		);
	}
}

/** Void type, for your convenience */
export const None = new PrimitiveType(Primitive.None, false);
/** Boolean type */
export const Bool = new PrimitiveType(Primitive.Bool, false);
/** Number type */
export const Num = new PrimitiveType(Primitive.Num, false);
/** String type */
export const Str = new PrimitiveType(Primitive.Str, false);
/** "Any" type */
export const Any = new AnyType(false);

/**
 * Determines whether or not the specified right-hand side type can be assigned
 * to the specified left-hand side type
 * @param lhs The type of the left-hand side (assignee)
 * @param rhs The type of the value being assigned
 */
export function allowAssignment(lhs: Type, rhs: Type): boolean {
	return lhs.isAssignable && lhs.equivalent(rhs);
}
