import { RuntimeType } from "src/vm/runtime-type";
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
	Finishing,
}

export class GarbageCollector {
	private fromSpace: HeapItem[] = [];
	/** True if the garbage collector has run at least once */
	private hasCollectedAtLeastOnce: boolean = false;
	/**
	 * How many allocations must occur before the garbage collector kicks in for
	 * the first time
	 */
	private initialMemoryThreshold: number = 100;
	/** Index of the next item to be scanned (that is, the next item to have its pointers updated) */
	private scanPtr: number = 0;
	/** Garbage collection state */
	private state: GCState = GCState.Ready;
	private toSpace: HeapItem[] = [];

	/** Index of the next item to be allocated */
	private get allocPtr(): number {
		return this.toSpace.length;
	}

	private get shouldCollect(): boolean {
		if (this.hasCollectedAtLeastOnce) {
			// TODO
		} else {
			if (this.toSpace.length >= this.initialMemoryThreshold) return true;
		}
		return false;
	}

	/**
	 * Allocate a spot on the heap to store the specified data
	 *
	 * This will perform a little bit of incremental garbage collection
	 *
	 * @param value The value to place on the heap
	 */
	public alloc(value: RuntimeValue, roots: RuntimeValue[]): number {
		const addr = this.allocPtr;
		this.toSpace.push({ forwardAddr: undefined, values: [value] });
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
				break;
			case GCState.Finishing:
				// Finish garbage collection
				break;
		}
	}

	private copy(fromSpaceIndex: number, fromSpace: HeapItem[]): number {
		const oldItem = fromSpace[fromSpaceIndex];
		// Create a copy of the old item
		const item: HeapItem = {
			forwardAddr: undefined,
			values: oldItem.values, // share array reference
		};
		// Place it in to-space:
		const addr = this.allocPtr;
		this.toSpace.push(item);
		// If the old item doesn't have a forwarding address...
		if (typeof oldItem.forwardAddr === "undefined") {
			// Set the forwarding address on the old one
			oldItem.forwardAddr = addr;
			//
			// Recursively copy any pointers contained inside the cell
			// for (let i = 0; i < item.values.length; i++) {
			// 	const value = item.values[i];
			// 	const index = value.value as number;
			// 	if (value.isPointer) {
			// 		// Replace old pointer with address of new value copied to heap
			// 		item.values[i] = new RuntimeValue(
			// 			RuntimeType.Pointer,
			// 			this.copy(index, fromSpace)
			// 		);
			// 	}
			// }
		}
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
}
