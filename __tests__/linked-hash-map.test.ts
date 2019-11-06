import { LinkedHashMap } from "../src/common/linked-hash-map";

describe("linked hash map", () => {
	const map = new LinkedHashMap<string, number>();
	it("should exist", () => {
		expect(map).toBeInstanceOf(LinkedHashMap);
	});
	it("should initialize sensibly", () => {
		map.set("a", 1);
		map.set("b", 2);
		map.set("c", 3);
	});
	it("should be iterable", () => {
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
	it("should have a description", () => {
		expect(map.toString()).toEqual("[object Map]");
		expect(map.description).toEqual("{a:1,b:2,c:3}");
	});
});
