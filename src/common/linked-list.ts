class LinkedListNode<T> {
	constructor(
		/** Node value */
		public value: T,
		/** Previous node */
		public previous?: LinkedListNode<T>,
		/** Next node */
		public next?: LinkedListNode<T>
	) {}
}

export class LinkedList<T> implements Iterable<[T, LinkedListNode<T>]> {
	protected _head: LinkedListNode<T> | undefined;
	protected _tail: LinkedListNode<T> | undefined;
	protected _length: number = 0;

	constructor(values: T[] = []) {
		for (const value of values) {
			this.push(value);
		}
	}

	public get head(): LinkedListNode<T> | undefined {
		return this._head;
	}

	public get tail(): LinkedListNode<T> | undefined {
		return this._tail;
	}

	public get length(): number {
		return this._length;
	}

	// MARK: Iterable<[T, LinkedListNode<T>]>

	public *iterator(): IterableIterator<[T, LinkedListNode<T>]> {
		let node = this._head;

		while (node) {
			yield [node.value, node];
			node = node.next;
		}
	}

	public [Symbol.iterator](): IterableIterator<[T, LinkedListNode<T>]> {
		return this.iterator();
	}

	public *nodes(): Iterable<LinkedListNode<T>> {
		let node = this._head;
		while (node) {
			yield node;
			node = node.next;
		}
	}

	public *values(): Iterable<T> {
		let node = this._head;
		while (node) {
			yield node.value;
			node = node.next;
		}
	}

	public push(value: T): LinkedListNode<T> {
		return this.insert(value, this._tail, false);
	}

	public pop(): LinkedListNode<T> | undefined {
		return this.remove(this._tail);
	}

	public shift(): LinkedListNode<T> | undefined {
		return this.remove(this._head);
	}

	public unshift(value: T): LinkedListNode<T> {
		return this.insert(value, this._head, true);
	}

	public append(
		value: T,
		node: LinkedListNode<T> | undefined = this._tail
	): LinkedListNode<T> | undefined {
		return this.insert(value, node, false);
	}

	public prepend(
		value: T,
		node: LinkedListNode<T> | undefined = this._head
	): LinkedListNode<T> | undefined {
		return this.insert(value, node, true);
	}

	public find(value: T): LinkedListNode<T> | undefined {
		let node = this._head;

		while (node) {
			if (node.value === value) return node;
			node = node.next;
		}
	}

	public remove(
		node: LinkedListNode<T> | undefined
	): LinkedListNode<T> | undefined {
		if (!node) return;
		this._length--;
		if (node.previous) {
			node.previous.next = node.next;
		} else {
			// Node was the head
			this._head = node.next;
		}
		if (node.next) {
			node.next.previous = node.previous;
		} else {
			// Node was the tail
			this._tail = node.previous;
		}

		node.next = undefined;
		node.previous = undefined;
		return node;
	}

	public insert(
		value: T,
		destNode?: LinkedListNode<T>,
		prepend: boolean = false
	): LinkedListNode<T> {
		this._length++;
		const node = new LinkedListNode<T>(value);
		if (!this._head && !this._tail) {
			this._head = node;
			this._tail = node;
			return node;
		}
		const dest = destNode ? destNode! : prepend ? this._head! : this._tail!;
		if (prepend) {
			node.previous = dest.previous;
			if (dest.previous) dest.previous.next = node;
			node.next = dest;
			dest.previous = node;
			if (this._head === dest) this._head = node;
		} else {
			node.next = dest.next;
			node.previous = dest;
			dest.next = node;
			if (this._tail === dest) this._tail = node;
		}
		return node;
	}
}
