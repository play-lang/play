import { LinkedHashMap } from "../../common/linked-hash-map";

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

abstract class Type {
	/** True if the type is addressable */
	public readonly isAddressable: boolean = false;

	/**
	 * Type subclasses should implement this to determine equivalence for a
	 * specified type
	 *
	 * @param type The comparison type
	 * @returns True if the specified type is equivalent to the receiver, false
	 * otherwise
	 */
	public abstract equivalent(type: Type): boolean;
}

/** Represents an error type */
export class ErrorType extends Type {
	constructor() {
		super();
	}

	public equivalent(type: Type): boolean {
		return type === this || type instanceof ErrorType;
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
		public readonly primitive: Primitive
	) {
		super();
	}

	public equivalent(type: Type): boolean {
		return (
			type === this ||
			(type instanceof PrimitiveType && type.primitive === this.primitive)
		);
	}
}

/**
 * A product of types is another, compounded, type in a structure.
 *
 * The "operands" of the product are types, and the structure of a product
 * type is determined by the fixed order of the operands in the product
 *
 * This product type ensures equivalence between another product type by
 * checking that its parameters have the same name, occur in the same order,
 * and have the same types
 *
 * https://en.wikipedia.org/wiki/Product_type
 *
 * This is not a true product type because the operand types are named
 *
 * In theory, this aligns more with the Dragon book's definition of a record
 * type (first edition, p. 345), but information on that is harder to
 * find elsewhere
 */
export class ProductType extends Type {
	constructor(
		/** The type operands for this product type keyed by the name */
		public readonly operands: LinkedHashMap<string, Type>
	) {
		super();
	}

	public equivalent(type: Type): boolean {
		if (type === this) return true;
		if (!(type instanceof ProductType)) return false;
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
}

/**
 * Represents a function type, which consists of a domain type for
 * the parameters (a product type containing multiple types) and a type
 * for the range (return value)
 */
export class FunctionType extends Type {
	constructor(
		/** Function parameters (domain) type */
		public readonly parameters: ProductType,
		/** Return value type (range type) */
		public readonly returnType: Type
	) {
		super();
	}

	public equivalent(type: Type): boolean {
		return (
			type === this ||
			(type instanceof FunctionType &&
				this.parameters.equivalent(type.parameters))
		);
	}
}

export class CollectionType extends Type {
	constructor(
		/** The type of collection being represented by this instance */
		public readonly collection: Collection,
		/** Type of the elements to be stored in the list */
		public readonly elementType: Type
	) {
		super();
	}

	public equivalent(type: Type): boolean {
		return (
			type === this ||
			(type instanceof CollectionType &&
				this.collection === type.collection &&
				this.elementType.equivalent(type.elementType))
		);
	}
}

/** Void type */
export const Void = new PrimitiveType(Primitive.Void);
/** String type */
export const Str = new PrimitiveType(Primitive.Str);
/** Number type */
export const Num = new PrimitiveType(Primitive.Num);
/** Boolean type */
export const Bool = new PrimitiveType(Primitive.Bool);
/** Error type */
export const ErrType = new ErrorType();

export const primitives: Map<string, PrimitiveType> = new Map([
	["void", Void],
	["str", Str],
	["num", Num],
	["bool", Bool],
]);

/**
 * Construct a type instance from the specified type annotation array
 *
 * @param typeAnnotation A type annotation string array
 * Examples include ["str"], ["bool"], ["Wizard"], ["str", "map"],
 * ["str", "list", "map"], ["num", "list"]
 */
export function constructType(typeAnnotation: string[]): Type {
	if (typeAnnotation.length < 1) return Void;
	let annotation = typeAnnotation[0]!;
	let type: Type = primitives.get(annotation) || ErrType;
	for (let i = 1; i < annotation.length; i++) {
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
				type = ErrType;
		}
	}
	return type;
}
