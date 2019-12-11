abstract class Type {
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
 * Primitive types that can be represented with an instance of a PrimitiveType
 */
export enum Primitive {
	Bool = 1,
	Num = 2,
	Str = 3,
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
 * Composite types that can be represented with an instance of a CompositeType
 *
 * A composite type (or constructed type) must contain a child type that
 * is a primitive or another composite
 */
export enum Composite {
	List,
	Map,
	Set,
	Action,
}

/**
 * A product of types is another, compounded, type in a structure.
 *
 * The "operands" of the product are types, and the structure of a product
 * type is determined by the fixed order of the operands in the product
 *
 * https://en.wikipedia.org/wiki/Product_type
 */
export abstract class ProductType extends Type {
	constructor(
		/** The type operands for this product type */
		public readonly operands: Type[] = []
	) {
		super();
	}

	public equivalent(type: Type): boolean {
		if (!(type instanceof ProductType)) return false;
		if (type.operands.length !== this.operands.length) return false;
		for (let i = 0; i < this.operands.length; i++) {
			const lhs = this.operands[i];
			const rhs = type.operands[i];
			if (!lhs.equivalent(rhs)) return false;
		}
		return true;
	}
}
