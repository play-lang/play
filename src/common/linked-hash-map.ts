import { Describable } from "../language/token";

class Entry<K, V> {
	constructor(public value: V, public readonly node: LinkedListNode<K>) {}
}

class LinkedListNode<K> {
	constructor(
		public readonly key: K,
		public readonly ordinal: number,
		public next?: LinkedListNode<K>,
		public prev?: LinkedListNode<K>
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
	private _head?: LinkedListNode<K>;
	private _tail?: LinkedListNode<K>;

	constructor() {}

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
		throw new Error("delete() not implemented.");
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
		let node: LinkedListNode<K>;
		if (this._dict.has(key)) {
			const entry = this._dict.get(key)!;
			entry.value = value;
		} else {
			node = this.appendNode(key);
			this._dict.set(key, new Entry(value, node));
			this._size++;
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

	private appendNode(key: K): LinkedListNode<K> {
		// Add a new linked list entry
		const node = new LinkedListNode<K>(key, this._size++);
		if (!this._head) {
			this._head = node;
			this._tail = node;
		} else {
			this._tail!.next = node;
			this._tail = node;
		}
		return node;
	}
}
