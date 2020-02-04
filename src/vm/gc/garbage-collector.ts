import { RuntimeValue } from "src/vm/runtime-value";

// https://www.cs.cornell.edu/courses/cs312/2003fa/lectures/sec24.htm

export interface HeapItem {
	/** Array of values contained in this heap item cell */
	readonly values: RuntimeValue[];

	/** Index of the heap item in to-space */
	forwardAddr: number | undefined;
}

enum GCState {
	/** Garbage collection is finished or has never been started */
	Ready,
	/** Scanning and copying items */
	Scanning,
	/** Cleaning up */
	Finishing,
}

export class GarbageCollector {
	/** From-space */
	private fromSpace: HeapItem[] = [];
	/** To-space */
	private toSpace: HeapItem[] = [];
	/** Index of the next item to be scanned (that is, the next item to have its pointers updated) */
	private scanPtr: number = 0;
	/** Garbage collection state */
	private state: GCState = GCState.Ready;

	/**
	 * Number of values allocated
	 *
	 * (The sum total of values inside recently allocated heap items)
	 *
	 * This allows the garbage collector to determine how many items to scan at
	 * once when performing incremental collection
	 */
	private sizeAllocated: number = 0;

	/** Index of the next item to be allocated */
	private get allocPtr(): number {
		return this.toSpace.length;
	}

	/**
	 * Allocate a spot on the heap to store the specified data
	 *
	 * This will perform a little bit of incremental garbage collection
	 *
	 * @param values The values to place on the heap
	 */
	public alloc(values: RuntimeValue[], roots: RuntimeValue[]): number {
		const addr = this.allocPtr;
		this.toSpace.push({ forwardAddr: undefined, values });
		this.sizeAllocated += values.length;
		this.collect(roots);
		return addr;
	}

	/**
	 * Collect a little bit of garbage
	 *
	 * This examines the garbage collection state and performs a little bit of
	 * incremental garbage collection
	 */
	public collect(roots: RuntimeValue[]): void {
		switch (this.state) {
			case GCState.Ready:
				// Start garbage collection
				this.startCollecting(roots);
				break;
			case GCState.Scanning:
				// Continue garbage collection
				this.scan();
				break;
			case GCState.Finishing:
				// Finish garbage collection
				break;
		}
	}

	private copy(fromSpaceIndex: number, fromSpace: HeapItem[]): number {
		const oldItem = fromSpace[fromSpaceIndex];
		if (typeof oldItem.forwardAddr !== "undefined") {
			// If item is already forwarded (meaning it is already copied), we
			// should just return the forwarded address
			return oldItem.forwardAddr;
		}
		// Create a copy of the item
		const item: HeapItem = {
			forwardAddr: undefined,
			values: oldItem.values, // share array reference
		};
		// Place it in to-space:
		const addr = this.allocPtr;
		this.toSpace.push(item);
		// Set the forwarding address on the old one
		oldItem.forwardAddr = addr;
		return addr;
	}

	/**
	 * Flip "from" and "to" space and reset scan and alloc pointers
	 *
	 * Copies roots to the new "to" space
	 *
	 * @param roots The mutator roots--these will be updated accordingly
	 */
	private flip(roots: RuntimeValue[]): void {
		this.fromSpace = this.toSpace;
		this.toSpace = [];
		this.scanPtr = 0;
		for (let i = 0; i < roots.length; i++) {
			const root = roots[i];
			if (root.isPointer) {
				// Replace this pointer with the correct pointer to the new item
				// located in to-space:
				roots[i] = new RuntimeValue(
					root.type,
					this.copy(root.value as number, this.fromSpace)
				);
			}
		}
	}

	/**
	 * Begin collecting garbage and update the garbage collector state
	 * @param roots The mutator roots
	 */
	private startCollecting(roots: RuntimeValue[]): void {
		// Flip from/to space, copy roots, reset scan and alloc pointers
		this.flip(roots);

		// Update state to the next state
		this.state = GCState.Scanning;
	}

	private scan(): void {
		while (this.sizeAllocated > 0 && this.scanPtr < this.allocPtr) {
			// Keep scanning until we reach our scan limit, which is determined by
			// the sum of recent allocation sizes
			const item = this.toSpace[this.scanPtr];
			for (let i = 0; i < item.values.length; i++) {
				const value = item.values[i];
				if (value.isPointer) {
					// Item contains a pointer--copy the thing it is pointing to and
					// update the pointer
					item.values[i] = new RuntimeValue(
						value.type,
						this.copy(value.value as number, this.fromSpace)
					);
				}
			}
			// Reduce the size of recently allocated items by the size of the items
			// we've scanned...large allocations take longer because the GC collects
			// proportionally to the size of the allocation O(n) even though actually
			// placing new items on the heap is O(1)
			this.sizeAllocated -= item.values.length;
		}
		// If the scan pointer caught up to the alloc pointer, we are done scanning!
		if (this.scanPtr >= this.allocPtr) this.state = GCState.Finishing;
	}
}
