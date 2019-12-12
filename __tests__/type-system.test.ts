import { LinkedHashMap } from "../src/common/linked-hash-map";
import { FunctionInfo } from "../src/language/function-info";
import {
	allowAssignment,
	constructFunctionType,
	constructType,
	Collection,
	CollectionType,
	ErrorType,
	FunctionType,
	Primitive,
	PrimitiveType,
	ProductType,
	Type,
	Void,
} from "../src/language/types/type-system";

describe("type system", () => {
	const str = new PrimitiveType(Primitive.Str, true);
	const num = new PrimitiveType(Primitive.Num, true);
	test("primitive & error types", () => {
		const str1 = new PrimitiveType(Primitive.Str, true);
		const str2 = new PrimitiveType(Primitive.Str, false);
		const num1 = new PrimitiveType(Primitive.Num, true);
		const num2 = new PrimitiveType(Primitive.Num, false);
		const err1 = new ErrorType(true);
		const err2 = new ErrorType(false);
		expect(str1.description).toBe("Ref<Str>");
		expect(str2.description).toBe("Str");
		expect(err1.description).toBe("Ref<ErrorType>");
		expect(err2.description).toBe("ErrorType");
		expect(str1.equivalent(str2)).toBe(true);
		expect(str2.equivalent(str1)).toBe(true);
		expect(str1.equivalent(num1)).toBe(false);
		expect(str1.equivalent(num2)).toBe(false);
		expect(num1.equivalent(num2)).toBe(true);
		expect(err1.equivalent(err2)).toBe(true);
		expect(err1.equivalent(str1)).toBe(false);
		expect(str2.equivalent(err2)).toBe(false);
	});
	test("product type", () => {
		const empty = new ProductType(new LinkedHashMap());
		const prod1 = new ProductType(
			new LinkedHashMap<string, Type>([
				["p1", constructType(["bool"])],
				["p2", constructType(["num", "set"])],
			]),
			true
		);
		const prod2 = new ProductType(
			new LinkedHashMap<string, Type>([
				["p1", constructType(["bool"])],
				["p2", constructType(["num", "set"])],
			])
		);
		const prod3 = new ProductType(
			new LinkedHashMap<string, Type>([
				["p2", constructType(["num", "set"])],
				["p1", constructType(["bool"])],
			])
		);
		const prod4 = new ProductType(
			new LinkedHashMap<string, Type>([
				["p2", constructType(["num", "set"])],
				["p1", constructType(["str"])],
			])
		);
		const prod5 = new ProductType(
			new LinkedHashMap<string, Type>([
				["p2", constructType(["num", "set"])],
				["p5", constructType(["bool"])],
			])
		);
		const prod6 = new ProductType(
			new LinkedHashMap<string, Type>([
				["p1", constructType(["str"])],
				["p2", constructType(["num", "set"])],
			])
		);
		expect(prod1.description).toBe("Ref<Bool, Set<Num>>");
		expect(prod2.description).toBe("<Bool, Set<Num>>");
		const t1 = constructType(["Num"]);
		expect(prod1.equivalent(prod1)).toBe(true);
		expect(prod1.equivalent(prod2)).toBe(true);
		expect(prod2.equivalent(prod1)).toBe(true);
		expect(prod1.equivalent(empty)).toBe(false);
		expect(empty.equivalent(prod1)).toBe(false);
		expect(prod1.equivalent(prod3)).toBe(false);
		expect(prod3.equivalent(prod1)).toBe(false);
		expect(prod1.equivalent(prod4)).toBe(false);
		expect(prod4.equivalent(prod1)).toBe(false);
		expect(prod1.equivalent(t1)).toBe(false);
		expect(prod1.equivalent(prod5)).toBe(false);
		expect(prod5.equivalent(prod1)).toBe(false);
		expect(prod1.equivalent(prod6)).toBe(false);
		expect(prod6.equivalent(prod1)).toBe(false);
		expect(t1.equivalent(prod1)).toBe(false);
	});
	test("function type", () => {
		const fun1 = new FunctionType(
			"fun1",
			new ProductType(
				new LinkedHashMap([
					["a", constructType(["str"])],
					["b", constructType(["str"])],
				])
			),
			constructType(["str"])
		);
		expect(fun1.description).toBe("(fun1(Str, Str) -> Str)");
		const fun2 = new FunctionType(
			"fun1",
			new ProductType(
				new LinkedHashMap([
					["a", constructType(["str"])],
					["b", constructType(["str"])],
				])
			),
			constructType(["str"])
		);
		const fun3 = new FunctionType(
			"fun3",
			new ProductType(
				new LinkedHashMap([
					["a", constructType(["str"])],
					["b", constructType(["str"])],
				])
			),
			constructType(["str"])
		);

		expect(fun1.equivalent(fun2)).toBe(true);
		expect(fun2.equivalent(fun1)).toBe(true);
		expect(fun1.equivalent(fun3)).toBe(false);
		expect(fun3.equivalent(fun1)).toBe(false);
		expect(fun1.equivalent(num)).toBe(false);
	});
	test("collection type", () => {
		const list1 = new CollectionType(
			Collection.List,
			new PrimitiveType(Primitive.Bool, false)
		);
		const list2 = new CollectionType(
			Collection.List,
			new PrimitiveType(Primitive.Bool, false),
			true
		);
		expect(list1.description).toBe("List<Bool>");
		expect(list2.description).toBe("Ref<List<Bool>>");
		const list3 = new CollectionType(
			Collection.List,
			new PrimitiveType(Primitive.Str, false)
		);
		expect(list1.equivalent(list2)).toBe(true);
		expect(list2.equivalent(list1)).toBe(true);
		expect(list1.equivalent(list3)).toBe(false);
		expect(list3.equivalent(list1)).toBe(false);
		expect(list1.equivalent(str)).toBe(false);
	});
	describe("type utilities", () => {
		test("type construction", () => {
			expect(constructType(["str"]).equivalent(str)).toBe(true);
			expect(
				constructType(["str", "list"]).equivalent(
					new CollectionType(Collection.List, str, false)
				)
			).toBe(true);
			expect(constructType([]).equivalent(Void)).toBe(true);
			expect(constructType(["void"]).equivalent(Void)).toBe(true);
			expect(
				constructType(["num", "unknown"]).equivalent(new ErrorType(false))
			).toBe(true);
			expect(
				constructType(["str", "map"]).equivalent(
					new CollectionType(Collection.Map, str, false)
				)
			).toBe(true);
		});
		test("function type construction", () => {
			expect(
				constructFunctionType(
					new FunctionInfo("fun1", ["str"], ["a"], new Map([["a", ["str"]]]))
				).equivalent(
					new FunctionType(
						"fun1",
						new ProductType(new LinkedHashMap([["a", str]])),
						str
					)
				)
			).toBe(true);
		});
		test("allow assignment", () => {
			const str1 = new PrimitiveType(Primitive.Str, true);
			const str2 = new PrimitiveType(Primitive.Str, false);
			// Should be able to assign a non assignable type to an assignable type
			expect(allowAssignment(str1, str2)).toBe(true);
			// Should NOT be able to assign an assignable type to a
			// non-assignable type
			expect(allowAssignment(str2, str1)).toBe(false);
		});
	});
});
