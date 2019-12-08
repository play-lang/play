/** Represents an addressability constraint for our type rules */
export enum AddressConstraint {
	None,
	AddressableOnly,
	NonAddressableOnly,
}

/** Represents a type in our simple type system */
export class TypeInfo {
	constructor(
		public readonly typeAnnotation: string[],
		public readonly isAddressable: boolean
	) {}

	/**
	 * Returns true if this type is matched by the specified type rule
	 * @param typeRule The rule to satisfy
	 */
	public satisfies(typeRule: TypeRule): boolean {
		return typeRule.matches(this);
	}
}

/** Represents a type rule for our simple type system */
export class TypeRule {
	constructor(
		/** An array of string arrays which represent the type of values allowed */
		public readonly typeAnnotation: string[],
		/** The addressability constraint for this rule, if any */
		public readonly addressConstraint: AddressConstraint = AddressConstraint.None
	) {}

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
			accepted = id === otherId;
			if (!accepted) break;
		}

		if (accepted) return true;
		return false;
	}
}

export class TypeRuleset {
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

	public matchMultiple(...types: TypeInfo[]): boolean {
		let rule: TypeRule | undefined;
		if (types.length < 1) return false;
		if (this.rules.length < 1) return false;
		for (const type of types) {
			if (rule) {
				if (!type.satisfies(rule)) return false;
			} else {
				rule = this.matches(type);
				if (!rule) return false;
			}
		}
		return true;
	}
}
