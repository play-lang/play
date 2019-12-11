import { LinkedHashMap } from "../../common/linked-hash-map";

/**
 * Primitive types that can be represented with an instance of a PrimitiveType
 */
export enum Primitive {
	Bool = 1,
	Num = 2,
	Str = 3,
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
		return type instanceof PrimitiveType && type.primitive === this.primitive;
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
			type instanceof FunctionType &&
			this.parameters.equivalent(type.parameters)
		);
	}
}

export class List extends Type {
	constructor(
		/** Type of the elements to be stored in the list */
		public readonly elementType: Type
	) {
		super();
	}

	public equivalent(type: Type): boolean {
		return (
			type instanceof List && this.elementType.equivalent(type.elementType)
		);
	}
}

export class Map extends Type {
	constructor(
		/* public readonly indexType: Type, */
		/** Type of the elements to be stored in the map */
		public readonly elementType: Type
	) {
		super();
	}

	public equivalent(type: Type): boolean {
		return type instanceof Map && this.elementType.equivalent(type.elementType);
	}
}

export class Set extends Type {
	constructor(
		/** Type of the elements to be stored in the set */
		public readonly elementType: Type
	) {
		super();
	}

	public equivalent(type: Type): boolean {
		return type instanceof Set && this.elementType.equivalent(type.elementType);
	}
}
