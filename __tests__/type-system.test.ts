import { LinkedHashMap } from "../src/common/linked-hash-map";
import { FunctionInfo } from "../src/language/function-info";
import {
	allowAssignment,
	Any,
	AnyType,
	Collection,
	CollectionType,
	ErrorType,
	FunctionType,
	None,
	Num,
	Primitive,
	PrimitiveType,
	ProductType,
	RecordType,
	Str,
	SumType,
	Type,
} from "../src/language/types/type-system";

describe("type system", () => {
	const str = new PrimitiveType(Primitive.Str, true);
	const num = new PrimitiveType(Primitive.Num, true);
	test("primitive & error types", () => {
		const str1 = new PrimitiveType(Primitive.Str, true);
		const str2 = new PrimitiveType(Primitive.Str);
		expect(str2.isAssignable).toBe(false);
		const num1 = new PrimitiveType(Primitive.Num, true);
		const num2 = new PrimitiveType(Primitive.Num, false);
		const err1 = new ErrorType(true);
		const err2 = new ErrorType();
		expect(err1.copy()).toBeInstanceOf(ErrorType);
		expect(str1.description).toBe("&Str");
		expect(str2.description).toBe("Str");
		expect(err1.description).toBe("&ErrorType");
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
	test("record type", () => {
		const empty = new RecordType(new LinkedHashMap());
		expect(empty.isAssignable).toBe(false);
		const rec1 = new RecordType(
			new LinkedHashMap<string, Type>([
				["p1", Type.construct("bool")],
				["p2", Type.construct("num set")],
			]),
			true
		);
		const rec2 = new RecordType(
			new LinkedHashMap<string, Type>([
				["p1", Type.construct("bool")],
				["p2", Type.construct("num set")],
			])
		);
		const rec3 = new RecordType(
			new LinkedHashMap<string, Type>([
				["p2", Type.construct("num set")],
				["p1", Type.construct("bool")],
			])
		);
		const rec4 = new RecordType(
			new LinkedHashMap<string, Type>([
				["p2", Type.construct("num set")],
				["p1", Type.construct("str")],
			])
		);
		const rec5 = new RecordType(
			new LinkedHashMap<string, Type>([
				["p2", Type.construct("num set")],
				["p5", Type.construct("bool")],
			])
		);
		const rec6 = new RecordType(
			new LinkedHashMap<string, Type>([
				["p1", Type.construct("str")],
				["p2", Type.construct("num set")],
			])
		);
		expect(rec1.description).toBe("&<p1: Bool, p2: Set<Num>>");
		expect(rec2.description).toBe("<p1: Bool, p2: Set<Num>>");
		const t1 = Num;
		expect(rec1.equivalent(rec1)).toBe(true);
		expect(rec1.equivalent(rec2)).toBe(true);
		expect(rec2.equivalent(rec1)).toBe(true);
		expect(rec1.equivalent(empty)).toBe(false);
		expect(empty.equivalent(rec1)).toBe(false);
		expect(rec1.equivalent(rec3)).toBe(false);
		expect(rec3.equivalent(rec1)).toBe(false);
		expect(rec1.equivalent(rec4)).toBe(false);
		expect(rec4.equivalent(rec1)).toBe(false);
		expect(rec1.equivalent(t1)).toBe(false);
		expect(rec1.equivalent(rec5)).toBe(false);
		expect(rec5.equivalent(rec1)).toBe(false);
		expect(rec1.equivalent(rec6)).toBe(false);
		expect(rec6.equivalent(rec1)).toBe(false);
		expect(t1.equivalent(rec1)).toBe(false);
		expect(rec6.copy().equivalent(rec6)).toBe(true);
	});
	test("product type", () => {
		expect(new ProductType([]).isAssignable).toBe(false);
		const prod1 = new ProductType([str, num], true);
		const prod2 = new ProductType([str, num], false);
		const prod3 = new ProductType([num, str], false);
		const prod4 = new ProductType([num]);
		expect(prod1.equivalent(prod1)).toBe(true);
		expect(prod1.equivalent(prod2)).toBe(true);
		expect(prod1.equivalent(str)).toBe(false);
		expect(prod1.equivalent(prod3)).toBe(false);
		expect(prod3.equivalent(prod1)).toBe(false);
		expect(prod1.equivalent(prod4)).toBe(false);
		expect(prod4.equivalent(prod1)).toBe(false);
		expect(prod1.description).toBe("&<&Str, &Num>");
		expect(prod2.description).toBe("<&Str, &Num>");
		const rec1 = new RecordType(
			new LinkedHashMap<string, Type>([
				["p1", str],
				["p2", num],
			]),
			true
		);
		const rec2 = new RecordType(
			new LinkedHashMap<string, Type>([
				["p1", str],
				["p2", Type.construct("num list")],
			]),
			true
		);
		const rec3 = new RecordType(
			new LinkedHashMap<string, Type>([["p1", Type.construct("str")]]),
			true
		);
		expect(prod1.satisfiesRecordType(rec1)).toBe(true);
		expect(prod1.satisfiesRecordType(rec2)).toBe(false);
		expect(prod1.satisfiesRecordType(rec3)).toBe(false);
		expect(prod1.copy().equivalent(prod1)).toBe(true);
	});
	test("sum type", () => {
		expect(new SumType([]).isAssignable).toBe(false);
		const sum1 = new SumType([Str, Num]);
		const sum2 = new SumType([Str, Num]);
		const sum3 = new SumType([Str]);
		const sum4 = new SumType([Str, Num, None, Any]);
		const sum5 = new SumType([Type.construct("num list"), Str, Num, None]);
		expect(sum1.equivalent(sum1)).toBe(true);
		expect(sum1.equivalent(sum2)).toBe(true);
		expect(sum2.equivalent(sum1)).toBe(true);
		expect(sum1.equivalent(sum3)).toBe(false);
		expect(sum3.equivalent(sum1)).toBe(false);
		expect(sum1.copy().equivalent(sum1)).toBe(true);
		expect(sum1.description).toBe("<Str | Num>");
		expect(sum3.description).toBe("<Str>");
		expect(sum4.description).toBe("<Str | Num | None | Any>");
		expect(sum4.equivalent(Any)).toBe(false);
		expect(sum4.equivalent(sum5)).toBe(false);
	});
	test("function type", () => {
		const fun1 = new FunctionType(
			"fun1",
			new RecordType(
				new LinkedHashMap([
					["a", Str],
					["b", Str],
				])
			),
			Str
		);
		expect(fun1.description).toBe("(fun1(Str, Str) -> Str)");
		const fun2 = new FunctionType(
			"fun1",
			new RecordType(
				new LinkedHashMap([
					["a", Str],
					["b", Str],
				])
			),
			Str
		);
		const fun3 = new FunctionType(
			"fun3",
			new RecordType(
				new LinkedHashMap([
					["a", Str],
					["b", Str],
				])
			),
			Str
		);

		expect(fun1.equivalent(fun2)).toBe(true);
		expect(fun2.equivalent(fun1)).toBe(true);
		expect(fun1.equivalent(fun3)).toBe(false);
		expect(fun3.equivalent(fun1)).toBe(false);
		expect(fun1.equivalent(num)).toBe(false);
		expect(fun1.copy().equivalent(fun1)).toBe(true);
	});
	test("collection type", () => {
		expect(new CollectionType(Collection.Map, Str).isAssignable).toBe(
			false
		);
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
		expect(list2.description).toBe("&List<Bool>");
		const list3 = new CollectionType(
			Collection.List,
			new PrimitiveType(Primitive.Str, false)
		);
		expect(list1.equivalent(list2)).toBe(true);
		expect(list2.equivalent(list1)).toBe(true);
		expect(list1.equivalent(list3)).toBe(false);
		expect(list3.equivalent(list1)).toBe(false);
		expect(list1.equivalent(str)).toBe(false);
		expect(list1.copy().equivalent(list1)).toBe(true);
	});
	test("any type", () => {
		expect(new AnyType().isAssignable).toBe(false);
		expect(Any.equivalent(Type.construct(["any"]))).toBe(true);
		expect(Any.equivalent(Type.construct("str list map"))).toBe(false);
		expect(Any.equivalent(Num)).toBe(false);
		expect(Any.equivalent(None)).toBe(false);
		expect(Any.accepts(Num)).toBe(true);
		expect(Any.accepts(Type.construct("num list"))).toBe(true);
		expect(Any.accepts(Type.construct(["any"]))).toBe(true);
		expect(Any.description).toBe("Any");
		expect(new AnyType(true).description).toBe("&Any");
		expect(Any.copy()).toBeInstanceOf(AnyType);
	});
	describe("type utilities", () => {
		test("type construction", () => {
			expect(Type.construct("str").equivalent(str)).toBe(true);
			expect(
				Type.construct("str list").equivalent(
					new CollectionType(Collection.List, str, false)
				)
			).toBe(true);
			expect(Type.construct([]).equivalent(None)).toBe(true);
			expect(Type.construct("none").equivalent(None)).toBe(true);
			expect(
				Type.construct("num unknown").equivalent(new ErrorType())
			).toBe(true);
			expect(
				Type.construct("unknown map").equivalent(
					new CollectionType(Collection.Map, new ErrorType())
				)
			).toBe(true);
			expect(
				Type.construct("str map").equivalent(
					new CollectionType(Collection.Map, str, false)
				)
			).toBe(true);
		});
		test("function type construction", () => {
			expect(
				Type.constructFunction(
					new FunctionInfo(
						"fun1",
						["str"],
						["a"],
						new Map([["a", ["str"]]])
					)
				).equivalent(
					new FunctionType(
						"fun1",
						new RecordType(new LinkedHashMap([["a", str]])),
						str
					)
				)
			).toBe(true);
			expect(Type.construct("str | num")).toBeInstanceOf(SumType);
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
