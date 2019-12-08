import {
	AddressConstraint,
	TypeInfo,
	TypeRule,
	TypeRuleset,
} from "../src/language/type-system";

describe("type system", () => {
	it("should validate a simple type rule", () => {
		const rule = new TypeRule(["map"]);
		expect(
			rule.matches(new TypeInfo(["str", "map", "list", "map"], true))
		).toBe(true);
		expect(rule.matches(new TypeInfo(["map"], true))).toBe(true);
		expect(
			rule.matches(new TypeInfo(["map list str map list list"], true))
		).toBe(false);
		expect(rule.matches(new TypeInfo(["str"], true))).toBe(false);
		expect(rule.matches(new TypeInfo([], false))).toBe(false);
	});
	it("should validate based on addressability", () => {
		const rule = new TypeRule(["map"], AddressConstraint.AddressableOnly);
		expect(rule.matches(new TypeInfo(["map"], false))).toBe(false);
		expect(rule.matches(new TypeInfo(["map"], true))).toBe(true);
		expect(rule.matches(new TypeInfo(["num", "map"], true))).toBe(true);
		expect(rule.matches(new TypeInfo(["map", "list"], true))).toBe(false);
	});
	it("should validate based on non-addressability", () => {
		const rule = new TypeRule(["map"], AddressConstraint.NonAddressableOnly);
		expect(rule.matches(new TypeInfo(["map"], false))).toBe(true);
		expect(rule.matches(new TypeInfo(["map"], true))).toBe(false);
		expect(rule.matches(new TypeInfo(["num", "map"], false))).toBe(true);
		expect(rule.matches(new TypeInfo(["map", "list"], false))).toBe(false);
	});
	it("types should satisfy rules", () => {
		const rule = new TypeRule(["wizard list"]);
		const t1 = new TypeInfo(["wizard list"], true);
		const t2 = new TypeInfo(["num list"], true);
		expect(t1.satisfies(rule)).toBe(true);
		expect(t2.satisfies(rule)).toBe(false);
	});
	describe("rulesets", () => {
		it("rulesets should match types", () => {
			const rules: TypeRule[] = [];
			rules.push(new TypeRule(["str", "map", "set"]));
			rules.push(new TypeRule(["num", "map", "set"]));
			const ruleset = new TypeRuleset(rules);
			expect(ruleset.matches(new TypeInfo(["str", "map", "set"], true))).toBe(
				rules[0]
			);
			expect(ruleset.matches(new TypeInfo(["num", "map", "set"], true))).toBe(
				rules[1]
			);
			expect(
				ruleset.matches(new TypeInfo(["str", "map"], false))
			).toBeUndefined();
			expect(
				ruleset.matchMultiple(
					new TypeInfo(["str", "map", "set"], true),
					new TypeInfo(["str", "map", "set"], true)
				)
			).toBe(true);
			expect(
				ruleset.matchMultiple(
					new TypeInfo(["str"], true),
					new TypeInfo(["str"], false)
				)
			).toBe(false);
			expect(
				ruleset.matchMultiple(
					new TypeInfo(["str", "map", "set"], true),
					new TypeInfo(["str"], false)
				)
			).toBe(false);
		});
		it("empty ruleset should return false", () => {
			const ruleset = new TypeRuleset([]);
			expect(ruleset.matchMultiple(new TypeInfo(["str", "set"], false))).toBe(
				false
			);
		});
		it("ruleset should return false on empty type annotation and empty parameters", () => {
			const rules: TypeRule[] = [];
			rules.push(new TypeRule(["str", "map"]));
			rules.push(new TypeRule(["num", "map"]));
			const ruleset = new TypeRuleset(rules);
			expect(ruleset.matchMultiple(new TypeInfo([], false))).toBe(false);
			expect(ruleset.matchMultiple()).toBe(false);
		});
	});
});
