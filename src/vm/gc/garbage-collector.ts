import { RuntimeValue } from "src/vm/runtime-value";

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
	Finished,
}

export class GarbageCollector {
	/** Index of the next item to be allocated */
	private get allocPtr(): number {
		return this.toSpace.length;
	}
	/** From-space */
	private fromSpace: HeapItem[] = [];
	/** To-space */
	private toSpace: HeapItem[] = [];
	/**
	 * Index of the next item to be scanned (that is, the next item to have
	 *  its pointers updated)
	 */
	private scanPtr: number = 0;
	/** Garbage collection state */
	private state: GCState = GCState.Ready;
	/**
	 * List of items that have already been scanned but have been updated by the
	 * mutator while scanning
	 */
	private updated: Set<number> = new Set();

	/**
	 * Number of items that the garbage collector thinks should be scanned
	 *
	 * As various writes and allocations are performed this number is increased
	 *
	 * As garbage is copied, compacted, and scanned, this number is decreased
	 */
	private numToScan: number = 0;

	/**
	 * Allocate a spot on the heap to store the specified data
	 *
	 * This will perform a little bit of incremental garbage collection
	 *
	 * @param values The values to place on the heap
	 * @param roots The root set from the mutator
	 */
	public alloc(values: RuntimeValue[], roots: RuntimeValue[]): number {
		const addr = this.allocPtr;
		this.toSpace.push({ forwardAddr: undefined, values });
		// Scan 2 items for every item allocated?
		this.numToScan += 2;
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
				// Start garbage collection by scanning the roots
				this.startCollecting(roots);
				break;
			case GCState.Scanning:
				// Continue garbage collection
				this.scan();
				// If the scan pointer caught up to the alloc pointer and there's
				// nothing else on the list of updated entries to re-scan, we are done
				// scanning and copying!
				if (this.scanPtr >= this.allocPtr && this.updated.size === 0) {
					this.state = GCState.Finished;
				}
				break;
			case GCState.Finished:
				// Finish garbage collection
				// On the next run, we will start scanning the roots
				this.state = GCState.Ready;
				break;
		}
	}

	/**
	 * Read barrier
	 *
	 * Should be called any time the mutator wants to read an index from the heap
	 *
	 * If the item at the specified index does not have a forwarding address,
	 * it is copied into to-space
	 *
	 * @param index The index of the item to read
	 * @returns The index of the item in to-space, for your convenience
	 */
	public read(index: number): number {
		if (!this.fromSpace[index]) {
			throw new Error(
				"Garbage collector cannot access heap at index " + index
			);
		}
		if (!this.isForwarded(this.fromSpace[index])) {
			return this.copy(index);
		}
		return index;
	}

	/**
	 * Write barrier
	 *
	 * Should be called whenever the mutator wants to update a pointer
	 * inside a heap item
	 *
	 * @param index The index of the item in from-space
	 * @param fieldIndex The index of the child pointer inside the heap item
	 * @param value The new pointer value
	 */
	public write(index: number, fieldIndex: number, value: RuntimeValue): void {
		if (!value.isPointer) {
			throw new Error(
				"Garbage collector only handles pointers in the write barrier"
			);
		}
		// Force the item we are mutating to be copied if it hasn't already
		const itemAddr = this.read(index);
		const item = this.toSpace[itemAddr];
		if (!item) {
			throw new Error(
				"Garbage collector cannot access heap at resolved index " +
					itemAddr +
					" for index " +
					index
			);
		}
		const field = item.values[fieldIndex];
		if (!field || !field.isPointer) {
			throw new Error(
				"Garbage collector cannot write to non-pointer field at field index " +
					fieldIndex +
					" at heap index " +
					index +
					" (resolved to " +
					itemAddr +
					")"
			);
		}
		// The address of the item that is being pointed to
		// If this item hasn't already been copied, it will be now
		const destAddr = this.read(value.value);
		// Update the pointer as requested
		item.values[fieldIndex] = new RuntimeValue(field.type, destAddr);
		if (itemAddr < this.scanPtr) {
			// Item was mutated after it has already been scanned, add it to the
			// list of items to be re-scanned
			//
			// This essentially prolongs the current garbage collection cycle
			this.updated.add(itemAddr);
			this.numToScan += 2;
		}
	}

	/**
	 * Copies a single item from from-space to to-space (if it is not already
	 * copied to to-space) and returns the address of the item in to-space
	 * @param fromSpaceIndex The index of the item to copy in from-space
	 */
	private copy(fromSpaceIndex: number): number {
		const oldItem = this.fromSpace[fromSpaceIndex];
		if (this.isForwarded(oldItem)) {
			// If item is already forwarded (meaning it is already copied), we
			// should just return the forwarded address
			return oldItem.forwardAddr as number;
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
		// From-space is assigned to be to-space, deleting all the junk that was in
		// from-space
		this.fromSpace = this.toSpace;
		// To-space is reset to be free space
		this.toSpace = [];
		this.scanPtr = 0;
		// Copy all of the roots
		for (let i = 0; i < roots.length; i++) {
			const root = roots[i];
			if (root.isPointer) {
				// Replace this pointer with the correct pointer to the new item
				// located in to-space:
				roots[i] = new RuntimeValue(
					root.type,
					this.copy(root.value as number)
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

	/**
	 * Scan however many objects are needed based on the sum of the sizes of
	 * recent allocations and copy them as needed
	 */
	private scan(): void {
		// Keep scanning until we reach our scan limit
		while (
			this.numToScan > 0 &&
			(this.scanPtr < this.allocPtr || this.updated.size > 0)
		) {
			// Find the address of the next item to scan
			//
			// This will come either from the next item after the scan pointer
			// OR an item from the set of updated items (the items that were updated
			// after they were scanned but before garbage collection completed)
			const addr =
				this.scanPtr < this.allocPtr
					? this.scanPtr++
					: (this.updated.values().next().value as number);
			// Grab item at the specified address
			const item: HeapItem = this.toSpace[addr];
			// If that address existed in our updated items list to scan, we
			// can go ahead and remove it since it is being scanned
			if (this.updated.has(addr)) this.updated.delete(addr);
			// Scan each field in the item
			for (let i = 0; i < item.values.length; i++) {
				const value = item.values[i];
				if (value.isPointer) {
					// Item contains a pointer--copy the thing it is pointing to and
					// update the pointer
					item.values[i] = new RuntimeValue(
						value.type,
						this.copy(value.value as number)
					);
				}
			}
			// Decrease how many items we need to scan
			this.numToScan -= 1;
		}
	}

	/** True if the specified heap item has a forwarding address */
	private isForwarded(item: HeapItem): boolean {
		return typeof item.forwardAddr !== "undefined";
	}
}
