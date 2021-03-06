import { Describable } from "src/common/describable";

class Entry<K, V> {
	constructor(public value: V, public readonly node: LinkedMapNode<K>) {}
}

class LinkedMapNode<K> {
	constructor(
		public readonly key: K,
		public ordinal: number,
		public next?: LinkedMapNode<K>,
		public prev?: LinkedMapNode<K>
	) {}
}

export class LinkedHashMap<K, V> implements Map<K, V>, Describable {
	public get size(): number {
		return this._size;
	}

	public get [Symbol.toStringTag](): string {
		return this._dict[Symbol.toStringTag];
	}

	public get description(): string {
		let desc: string = "{";
		let i = 1;
		this._dict.forEach((entry, key) => {
			desc += JSON.stringify(key).slice(1, -1);
			desc += ":";
			desc += JSON.stringify(entry.value);
			if (i < this._size) desc += ",";
			i++;
		});
		desc += "}";
		return desc;
	}

	private _size: number = 0;
	private _dict: Map<K, Entry<K, V>> = new Map<K, Entry<K, V>>();
	private _head?: LinkedMapNode<K>;
	private _tail?: LinkedMapNode<K>;

	constructor(items: Iterable<[K, V]> = []) {
		for (const [key, value] of items) {
			this.set(key, value);
		}
	}

	public *[Symbol.iterator](): IterableIterator<[K, V]> {
		let current = this._head;
		while (current) {
			yield [current.key, this._dict.get(current.key)!.value];
			if (current === this._tail) break;
			current = current.next;
		}
		current = this._head;
	}

	public clear(): void {
		this._size = 0;
		this._dict = new Map<K, Entry<K, V>>();
		this._head = undefined;
		this._tail = undefined;
	}

	public delete(key: K): boolean {
		// This will be O(n) instead of O(1) since we have to readjust
		// ordinal numbers in values list
		if (!this.has(key)) return false;
		const entry = this._dict.get(key)!;
		// Perform a textbook linked list node removal:
		this._dict.delete(key);
		const node = entry.node;
		const prev = node.prev;
		let next = node.next;
		if (next && prev) {
			// Delete a node surrounded by other nodes
			prev.next = next;
			next.prev = prev;
		} else if (next && !prev) {
			// Delete the head node
			this._head = next;
		} else if (!next && prev) {
			// Delete the tail node
			this._tail = prev;
		} else if (!next && !prev) {
			// Delete the only node in the list (both head and tail node)
			this._head = undefined;
			this._tail = undefined;
		}

		// Subtract from the insertion ordering ordinals of the nodes
		// following the deleted node so that they will still be correct...
		// this is where the O(n) process kicks in that makes delete slow for
		// this data structure
		while (next) {
			next.ordinal -= 1;
			next = next.next;
		}

		// Reduce our size
		this._size--;

		// TODO: A good test would be to run through the list after every delete
		// and ensure the following invariants:
		// - Size == number of elements in map
		// - All elements have the proper ordinal numbers
		// - All elements have the appropriate key for their value
		// - Map has same size as linked list length
		// - Head and tail are synced properly

		// Let garbage collection have at em:
		node.next = undefined;
		node.prev = undefined;

		return true;
	}

	public forEach(
		callbackfn: (value: V, key: K, map: Map<K, V>) => void,
		thisArg?: any
	): void {
		for (const [key, value] of this) {
			callbackfn(value, key, this);
		}
	}

	public get(key: K): V | undefined {
		const entry = this._dict.get(key);
		if (entry) {
			return entry.value;
		}
		return undefined;
	}

	public has(key: K): boolean {
		return this._dict.has(key);
	}

	public set(key: K, value: V): this {
		let node: LinkedMapNode<K>;
		if (this._dict.has(key)) {
			const entry = this._dict.get(key)!;
			entry.value = value;
		} else {
			node = this.appendNode(key);
			this._dict.set(key, new Entry(value, node));
		}
		return this;
	}

	public entries(): IterableIterator<[K, V]> {
		return this[Symbol.iterator]();
	}

	public keys(): IterableIterator<K> {
		return this._dict.keys();
	}

	public values(): IterableIterator<V> {
		return this.valueIterator();
	}

	/**
	 * Returns the insertion order as an ordinal value for the property
	 * with the specified key if it is found
	 * @param key Map key
	 */
	public ordinal(key: K): number | undefined {
		if (!this.has(key)) return undefined;
		return this._dict.get(key)!.node.ordinal;
	}

	private *valueIterator(): IterableIterator<V> {
		let current = this._head;
		while (current) {
			yield this._dict.get(current.key)!.value;
			if (current === this._tail) break;
			current = current.next;
		}
		current = this._head;
	}

	private appendNode(key: K): LinkedMapNode<K> {
		// Add a new linked list entry
		const node = new LinkedMapNode<K>(key, this._size++);
		if (!this._head) {
			this._head = node;
			this._tail = node;
		} else {
			node.prev = this._tail;
			this._tail!.next = node;
			this._tail = node;
		}
		return node;
	}
}
