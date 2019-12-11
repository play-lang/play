import { LinkedHashMap } from "../../common/linked-hash-map";
import { FunctionInfo } from "../function-info";

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

export abstract class Type {
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
}

/** Represents an error type */
export class ErrorType extends Type {
	constructor(isAssignable: boolean) {
		super(isAssignable);
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
		public readonly operands: LinkedHashMap<string, Type>,
		isAssignable: boolean = false
	) {
		super(isAssignable);
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
		/** Name of the function */
		public readonly name: string,
		/** Function parameters (domain) type */
		public readonly parameters: ProductType,
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
}

/** Void type, for your convenience */
export const Void = new PrimitiveType(Primitive.Void, false);

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
	const parametersType = new ProductType(parameters);
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
