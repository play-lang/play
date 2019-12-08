import { LinkedList } from "../src/common/linked-list";

describe("linked list", () => {
	test("initialize with values", () => {
		const values = [1, 2, 3, 4, 5, 6];
		const list = new LinkedList<number>(values);
		testList(list, values);
	});
	test("push/append", () => {
		const list = new LinkedList<number>();
		list.push(1);
		list.push(2);
		const three = list.push(3);
		list.push(5);
		list.push(6);
		list.append(4, three);
		list.append(7);
		testList(list, [1, 2, 3, 4, 5, 6, 7]);
	});
	test("unshift/prepend", () => {
		const list = new LinkedList<number>();
		list.unshift(7);
		list.unshift(6);
		const five = list.unshift(5);
		list.unshift(3);
		list.unshift(2);
		list.unshift(1);
		list.prepend(4, five);
		testList(list, [1, 2, 3, 4, 5, 6, 7]);
	});
	test("pop", () => {
		const list = new LinkedList<number>([1, 2, 3]);
		expect(list.pop()!.value).toBe(3);
		expect(list.pop()!.value).toBe(2);
		expect(list.pop()!.value).toBe(1);
		expect(list.pop()).toBeUndefined();
	});
	test("shift", () => {
		const list = new LinkedList<number>([1, 2, 3]);
		expect(list.shift()!.value).toBe(1);
		expect(list.shift()!.value).toBe(2);
		expect(list.shift()!.value).toBe(3);
		expect(list.shift()).toBeUndefined();
	});
	test("insert defaults", () => {
		const list = new LinkedList<number>();
		list.insert(1);
		testList(list, [1]);
	});
	test("insert prepend defaults", () => {
		const list = new LinkedList<number>();
		list.insert(2, undefined, true);
		list.insert(1, undefined, true);
		list.insert(3, undefined, false);
		testList(list, [1, 2, 3]);
	});
	test("prepend defaults", () => {
		const list = new LinkedList<number>([2]);
		list.prepend(1);
		testList(list, [1, 2]);
	});
	test("find", () => {
		const list = new LinkedList<number>([1, 2, 3]);
		expect(list.find(3)!.value).toBe(3);
	});
	test("nodes iterator", () => {
		const values = [1, 2, 3, 4, 5];
		const list = new LinkedList<number>(values);
		let i = 0;
		for (const node of list.nodes()) {
			expect(node.value).toBe(values[i]);
			i++;
		}
	});
	test("values iterator", () => {
		const values = [1, 2, 3, 4, 5];
		const list = new LinkedList<number>(values);
		let i = 0;
		for (const value of list.values()) {
			expect(value).toBe(values[i]);
			i++;
		}
	});
	test("list iterator", () => {
		const values = [1, 2, 3, 4, 5];
		const list = new LinkedList<number>(values);
		let i = 0;
		for (const [value, node] of list) {
			expect(node.value).toBe(values[i]);
			expect(value).toBe(values[i]);
			i++;
		}
	});
});

function testList<T>(list: LinkedList<T>, items: T[]): void {
	let i = 0;
	for (const item of list.values()) {
		expect(item).toEqual(items[i]);
		i++;
	}
	if (items.length > 0) {
		expect(list.head!.value).toBe(items[0]);
		expect(list.tail!.value).toBe(items[items.length - 1]);
	}
	expect(list.length).toBe(items.length);
}
