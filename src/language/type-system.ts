import { Describable } from "./token";

/** Represents an addressability constraint for our type rules */
export enum AddressConstraint {
	None,
	AddressableOnly,
	NonAddressableOnly,
}

export class BaseType {
	constructor(
		/** Array of type components with innermost component first */
		public readonly typeAnnotation: string[]
	) {}

	/** The innermost type */
	public get storageType(): string {
		return this.typeAnnotation[0] || "void";
	}

	public objectType(typeComponent: string = this.storageType): boolean {
		switch (typeComponent) {
			case "void":
			case "num":
			case "str":
			case "bool":
			case "list":
			case "map":
			case "set":
				return false;
		}
		return true;
	}

	/**
	 * Returns true if this type is exactly the same as the specified type,
	 * false otherwise
	 *
	 * Disregards addressability
	 *
	 * @param type The type to compare
	 */
	public equals(type: BaseType): boolean {
		if (this.typeAnnotation.length !== type.typeAnnotation.length) return false;
		for (let i = 0; i < this.typeAnnotation.length; i++) {
			if (this.typeAnnotation[i] !== type.typeAnnotation[i]) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Returns true if this type is a supertype of the specified type, false
	 * otherwise
	 *
	 * Disregards addressability
	 *
	 * Note that every type is a supertype and a subtype of itself
	 *
	 * @param type The type to compare
	 */
	public supertypeOf(type: BaseType): boolean {
		let accepted = false;
		// Addressability is satisfied, let's examine the actual types
		const typeAnnotation = this.typeAnnotation;
		// If the specified type has a length less than the rule, it is impossible
		// for the type to be accepted by the rule
		if (type.typeAnnotation.length < typeAnnotation.length) return false;

		// Walk backwards through the type components and see if there is
		// a conflict
		for (let i = typeAnnotation.length - 1; i >= 0; i--) {
			const id = typeAnnotation[i];
			const otherId =
				type.typeAnnotation[
					type.typeAnnotation.length + (i - typeAnnotation.length)
				];
			// TODO: Make this work with an inheritance graph someday
			accepted =
				id === otherId || (id === "object" && this.objectType(otherId));
			if (!accepted) break;
		}

		if (accepted) return true;
		return false;
	}

	/**
	 * Returns true if this type is a subtype of the specified type, false
	 * otherwise
	 *
	 * Disregards addressability
	 *
	 * Note that every type is a supertype and a subtype of itself
	 * @param type The type to compare
	 */
	public subtypeOf(type: BaseType): boolean {
		return type.supertypeOf(this);
	}

	// MARK: Describable
	public get description(): string {
		if (this.typeAnnotation.length < 1) {
			return "void";
		}
		return this.typeAnnotation.join(" ");
	}
}

/** Represents a type in our simple type system */
export class TypeInfo extends BaseType {
	constructor(
		public readonly typeAnnotation: string[],
		/** Whether or not this type is addressable */
		public readonly isAddressable: boolean
	) {
		super(typeAnnotation);
	}

	/**
	 * Returns true if this type is matched by the specified type rule
	 * @param typeRule The rule or ruleset to satisfy
	 */
	public satisfies(typeRule: TypeRule | TypeRuleset): boolean {
		return !!typeRule.matches(this);
	}
}

/** Represents a type rule for our simple type system */
export class TypeRule extends BaseType {
	constructor(
		/** An array of string arrays which represent the type of values allowed */
		public readonly typeAnnotation: string[],
		/** The addressability constraint for this rule, if any */
		public readonly addressConstraint: AddressConstraint = AddressConstraint.None
	) {
		super(typeAnnotation);
	}

	/**
	 * Returns true if the specified type is allowed (or matched) by this type
	 * rule
	 * @param type The type to examine
	 */
	public matches(type: TypeInfo): boolean {
		if (type.typeAnnotation.length < 1) return false;
		// If we care about whether or not a type is addressable (a left-hand
		// side value), we should ensure the type matches our addressability
		// requirement first since it is a more efficient operation
		if (
			this.addressConstraint === AddressConstraint.AddressableOnly &&
			!type.isAddressable
		) {
			return false;
		}
		if (
			this.addressConstraint === AddressConstraint.NonAddressableOnly &&
			type.isAddressable
		) {
			return false;
		}

		return this.supertypeOf(type);
	}
}

export class TypeRuleset implements Describable {
	constructor(
		/** Rules contained in this ruleset */
		public readonly rules: TypeRule[]
	) {}

	/**
	 * Returns the first rule in the ruleset that the specified type
	 * satisfies, if any
	 * @param type The type in question
	 */
	public matches(type: TypeInfo): TypeRule | undefined {
		for (const rule of this.rules) {
			if (type.satisfies(rule)) return rule;
		}
	}

	/**
	 * Returns true if the specified types all match the same rule
	 *
	 * Be sure to structure rulesets in such a way that multiple rules
	 * do not overlap (rules should be disjoint)
	 *
	 * @param types The types to match
	 */
	public matchMultiple(...types: TypeInfo[]): TypeRule | undefined {
		let rule: TypeRule | undefined;
		if (types.length < 1) return;
		if (this.rules.length < 1) return;
		for (const type of types) {
			if (rule) {
				if (!type.satisfies(rule)) return;
			} else {
				rule = this.matches(type);
				if (!rule) return;
			}
		}
		return rule;
	}

	// MARK: Describable
	public get description(): string {
		return this.rules
			.map(typeRule => {
				return "`" + typeRule.typeAnnotation.join(" ") + "`";
			})
			.join(", ");
	}
}
