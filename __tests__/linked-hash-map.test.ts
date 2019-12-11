import { LinkedHashMap } from "../src/common/linked-hash-map";

describe("linked hash map", () => {
	test("should exist", () => {
		expect(new LinkedHashMap<string, number>()).toBeInstanceOf(LinkedHashMap);
	});
	test("should initialize sensibly", () => {
		const map = new LinkedHashMap<string, number>();
		map.set("a", 1);
		map.set("b", 2);
		map.set("c", 3);
	});
	test("should be iterable", () => {
		const map = new LinkedHashMap<string, number>();
		map.set("a", 1);
		map.set("b", 2);
		map.set("c", 3);
		let i = 0;
		const keys = ["a", "b", "c"];
		const values = [1, 2, 3];
		for (const [key, value] of map.entries()) {
			expect(key).toEqual(keys[i]);
			expect(value).toEqual(values[i]);
			i++;
		}
		// See if the iterator resets itself
		i = 0;
		for (const [key, value] of map.entries()) {
			expect(key).toEqual(keys[i]);
			expect(value).toEqual(values[i]);
			i++;
		}
	});
	test("should have a description", () => {
		const map = new LinkedHashMap<string, number>();
		map.set("a", 1);
		map.set("b", 2);
		map.set("c", 3);
		expect(map.toString()).toEqual("[object Map]");
		expect(map.description).toEqual("{a:1,b:2,c:3}");
	});
	test("should maintain insertion ordinal", () => {
		const map = new LinkedHashMap<number, string>();
		map.set(1, "a");
		map.set(2, "b");
		map.set(3, "c");
		map.set(4, "d");
		map.set(5, "e");
		const ordinals = [0, 1, 2, 3, 4];
		let i = 0;
		for (const key of map.keys()) {
			expect(map.ordinal(key)).toEqual(ordinals[i]);
			i++;
		}
	});
	test("should adjust ordinals after delete", () => {
		const map = new LinkedHashMap<number, string>();
		map.set(1, "a");
		map.set(2, "b");
		map.set(3, "c");
		map.set(4, "d");
		map.set(5, "e");
		map.delete(3);
		const ordinals = [0, 1, 2, 3];
		let i = 0;
		for (const key of map.keys()) {
			expect(map.ordinal(key)).toEqual(ordinals[i]);
			i++;
		}
		expect(map.size).toEqual(4);
	});
	test("should adjust ordinals after head delete", () => {
		const map = new LinkedHashMap<number, string>();
		map.set(1, "a");
		map.set(2, "b");
		map.set(3, "c");
		map.set(4, "d");
		map.set(5, "e");
		map.delete(1);
		const ordinals = [0, 1, 2, 3];
		let i = 0;
		for (const key of map.keys()) {
			expect(map.ordinal(key)).toEqual(ordinals[i]);
			i++;
		}
		expect(map.size).toEqual(4);
	});
	test("should adjust ordinals after tail delete", () => {
		const map = new LinkedHashMap<number, string>();
		map.set(1, "a");
		map.set(2, "b");
		map.set(3, "c");
		map.set(4, "d");
		map.set(5, "e");
		map.delete(5);
		const ordinals = [0, 1, 2, 3];
		let i = 0;
		for (const key of map.keys()) {
			expect(map.ordinal(key)).toEqual(ordinals[i]);
			i++;
		}
		expect(map.size).toEqual(4);
	});
	test("should fail delete non-key", () => {
		const map = new LinkedHashMap<number, string>();
		map.set(1, "a");
		map.delete(2);
		const ordinals = [0];
		let i = 0;
		for (const key of map.keys()) {
			expect(map.ordinal(key)).toEqual(ordinals[i]);
			i++;
		}
		expect(map.size).toEqual(1);
	});
	test("should delete only key", () => {
		const map = new LinkedHashMap<number, string>();
		map.set(1, "a");
		map.delete(1);
		const ordinals: number[] = [];
		let i = 0;
		for (const key of map.keys()) {
			expect(map.ordinal(key)).toEqual(ordinals[i]);
			i++;
		}
		expect(map.size).toEqual(0);
	});
	test("should iterate over values", () => {
		const map = new LinkedHashMap<string, string>();
		map.set("k1", "a");
		map.set("k2", "b");
		map.set("k3", "c");
		map.set("k4", "d");
		map.set("k5", "e");
		const values = ["a", "b", "c", "d", "e"];
		let i = 0;
		for (const value of map.values()) {
			expect(value).toEqual(values[i]);
			i++;
		}
		expect(map.size).toEqual(5);
	});
	test("should clear everything", () => {
		const map = new LinkedHashMap<string, string>();
		map.set("k1", "a");
		map.set("k2", "b");
		map.set("k3", "c");
		map.set("k4", "d");
		map.set("k5", "e");
		map.clear();
		expect(map.size).toEqual(0);
	});
	test("should do forEach in order", () => {
		const map = new LinkedHashMap<string, string>();
		map.set("k1", "a");
		map.set("k2", "b");
		map.set("k3", "c");
		map.set("k4", "d");
		map.set("k5", "e");
		const answerKey = [
			{
				key: "k1",
				value: "a",
			},
			{
				key: "k2",
				value: "b",
			},
			{
				key: "k3",
				value: "c",
			},
			{
				key: "k4",
				value: "d",
			},
			{
				key: "k5",
				value: "e",
			},
		];
		let i = 0;
		map.forEach((value, key, map) => {
			expect(value).toEqual(answerKey[i].value);
			expect(key).toEqual(answerKey[i].key);
			i++;
		});
	});
	test("get and set should work", () => {
		const map = new LinkedHashMap<string, string>();
		map.set("k1", "a");
		map.set("k2", "b");
		map.set("k3", "c");
		expect(map.get("k1")).toEqual("a");
		map.set("k1", "d");
		expect(map.get("k1")).toEqual("d");
		expect(map.get("k2")).toEqual("b");
		expect(map.get("k3")).toEqual("c");
		expect(map.get("k4")).toEqual(undefined);
		expect(map.ordinal("k4")).toEqual(undefined);
	});
	test("should delete the only thing in the list", () => {
		const map = new LinkedHashMap<string, string>();
		map.set("k1", "a");
		map.delete("k1");
		map.delete("k0");
	});
});
