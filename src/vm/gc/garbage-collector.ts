import { Describable } from "src/common/describable";
import { RuntimeType } from "src/vm/runtime-type";
import { RuntimeValue } from "src/vm/runtime-value";

export interface HeapItem {
	/** Array of values contained in this heap item cell */
	values: RuntimeValue[];
	/** Index of the heap item in to-space */
	forwardAddr: number | undefined;
}

/** Garbage collector configuration */
interface GCConfig {
	/** Garbage collector heap size */
	heapSize: number;
	/** Number of items to scan for every item allocated */
	numScanPerAlloc: number;
	/** Number of items to scan for every item updated */
	numScanPerUpdate: number;
	/** Number of items to scan for every root pointer given when gc starts */
	numScanPerRoot: number;
	/** True if diagnostics logging should be enabled */
	debug: boolean;
}

/** Garbage collector initialization options */
export type GCInitConfig = Partial<GCConfig>;

/** Default garbage collector settings */
const GCDefaults: GCConfig = {
	heapSize: 1024,
	numScanPerAlloc: 1,
	numScanPerUpdate: 1,
	numScanPerRoot: 1,
	debug: true,
};

enum GCState {
	/** Garbage collection is finished or has never been started */
	Starting,
	/** Scanning and copying items */
	Scanning,
	/** Cleaning up */
	Idle,
}

/**
 * A simple conservative, incremental copying/compacting garbage collector
 */
export class GarbageCollector implements Describable {
	/** Index of the next item to be allocated */
	private allocPtr: number = 0;
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
	private state: GCState = GCState.Idle;
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

	/** Garbage collector settings */
	private config: GCConfig;

	private log: string[] = [];

	/** Heap used by the garbage collector */
	public get heap(): HeapItem[] {
		return this.toSpace;
	}

	constructor(settings?: GCInitConfig) {
		this.config = { ...GCDefaults, ...settings };
	}

	/**
	 * Allocate a spot on the heap to store the specified data
	 *
	 * This will perform a little bit of incremental garbage collection
	 *
	 * @param values The values to place on the heap
	 * @param roots The root set from the mutator
	 */
	public alloc(values: RuntimeValue[], roots: RuntimeValue[]): number {
		let startedCollection = false;
		let addr: number;
		let item: HeapItem;
		if (this.allocPtr > this.config.heapSize - 1) {
			// There isn't any room left on the heap
			//
			// Start or continue garbage collection:
			if (this.state === GCState.Idle) {
				startedCollection = true;
				this.state = GCState.Starting;
				this.collect(roots); // Copy roots
			}
			// This has the (unfortunate) side-effect of creating floating garbage
			//
			// Even though this heap item may not live very long, it will be kept
			// around until the next garbage collection cycle
			addr = this.copyIntoToSpace(values);
		} else {
			addr = this.allocPtr++;
			this.toSpace.push({ forwardAddr: undefined, values });
		}
		item = this.toSpace[addr];
		this.scanItem(item);
		// Increase the amount of things we need to scan:
		this.incNumToScan(this.config.numScanPerAlloc);
		// Do a little bit of garbage collection if we haven't already started
		if (!startedCollection) {
			this.collectIfNeeded(roots);
		}
		if (this.config.debug) {
			this.log.push(
				"alloc [" +
					values.map(v => v.description).join(",") +
					"] with roots [" +
					roots.map(r => r.description).join(",") +
					"] at " +
					addr
			);
		}
		return addr;
	}

	/**
	 * Run the garbage collector only if it isn't idle
	 * @param roots The mutator roots
	 */
	public collectIfNeeded(roots: RuntimeValue[]): void {
		if (this.state === GCState.Idle) return;
		if (this.config.debug) {
			this.log.push("collectIfNeeded: true");
		}
		this.collect(roots);
	}

	/**
	 * Collect all garbage all at once (stop-the-world style)
	 * @param roots The mutator roots
	 */
	public collectAll(roots: RuntimeValue[]): void {
		if (this.config.debug) this.log.push("collectAll");
		// Finish any current garbage collection cycle
		while (this.state !== GCState.Idle) {
			this.collect(roots);
		}
		// Start the next garbage collection cycle
		this.collect(roots);
		// Finish the garbage collection cycle we just started
		while (this.state !== GCState.Idle) {
			this.collect(roots);
		}
	}

	/**
	 * Start garbage collection if a cycle is not already underway
	 *
	 * If a garbage collection cycle is active, this will attempt to collect a
	 * little bit of garbage as part of the incremental collection process
	 */
	public collect(roots: RuntimeValue[]): void {
		const oldState = this.state;
		switch (this.state) {
			case GCState.Starting:
				// Start garbage collection by scanning the roots
				this.flip(roots);
				// Roots are copied so we move to the scan state
				this.state = GCState.Scanning;
				break;
			case GCState.Scanning:
				// Continue garbage collection
				this.scan();
				// If the scan pointer caught up to the alloc pointer and there's
				// nothing else on the list of updated entries to re-scan, we are done
				// scanning and copying!
				if (
					this.scanPtr >= this.allocPtr - 1 &&
					this.updated.size === 0
				) {
					this.state = GCState.Idle;
				}
				break;
			case GCState.Idle:
				// Start garbage collecting!
				this.state = GCState.Starting;
				break;
		}
		if (this.config.debug) {
			this.log.push(
				"collect roots [" +
					roots.map(r => r.description).join(",") +
					"], " +
					GCState[oldState] +
					" -> " +
					GCState[this.state]
			);
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
	 * @param addr The address of the heap item
	 * @returns The index of the item in to-space, for your convenience
	 */
	public read(addr: number): number {
		if (!this.fromSpace[addr]) {
			if (!this.toSpace[addr]) {
				throw new Error(
					"Garbage collector cannot access heap at index " + addr
				);
			}
			if (this.config.debug) {
				this.log.push("read to-space " + addr);
			}
			return addr;
		}
		if (!this.isForwarded(this.fromSpace[addr])) {
			const copy = this.copy(addr);
			if (this.config.debug) {
				this.log.push(
					"read from-space " + addr + " and copy to " + copy
				);
			}
			return copy;
		}
		const forward = this.fromSpace[addr].forwardAddr as number;
		if (this.config.debug) {
			this.log.push("read forward from " + addr + " to " + forward);
		}
		return forward;
	}

	/**
	 * Update a field containing a pointer within the specified heap item
	 *
	 * Should be called whenever the mutator wants to update a pointer
	 * inside a heap item
	 *
	 * This will copy the heap item and preserve it for another garbage collection
	 * cycle
	 *
	 * @param addr The address of the heap item
	 * @param fieldIndex The index of the child value inside the heap item
	 * @param value The new pointer value
	 */
	public update(addr: number, fieldIndex: number, value: RuntimeValue): void {
		// Force the item we are mutating to be copied if it hasn't already
		const itemAddr = this.read(addr);
		const item = this.toSpace[itemAddr];
		const field = item.values[fieldIndex];
		if (!field) {
			throw new Error(
				"Garbage collector cannot write to non-existent field at field index " +
					fieldIndex +
					" at heap index " +
					addr +
					" (resolved to " +
					itemAddr +
					")"
			);
		}
		if (value.isPointer) {
			// The address of the item that is being pointed to
			// If this item hasn't already been copied, it will be now
			const destAddr = this.read(value.value);
			// Update the pointer as requested
			item.values[fieldIndex] = new RuntimeValue(
				RuntimeType.Pointer,
				destAddr
			);
		} else {
			item.values[fieldIndex] = value.copy();
		}
		if (itemAddr < this.scanPtr) {
			// Item was mutated after it has already been scanned, add it to the
			// list of items to be re-scanned
			//
			// This essentially prolongs the current garbage collection cycle
			this.updated.add(itemAddr);
			// Increase the amount of things we need to scan
			this.incNumToScan(this.config.numScanPerUpdate);
		}
		if (this.config.debug) {
			this.log.push(
				"update (" +
					addr +
					" loc at " +
					itemAddr +
					") field " +
					fieldIndex +
					" to " +
					value.description
			);
		}
	}

	/**
	 * Remove field(s) from the heap item at the specified index
	 *
	 * This will copy the heap item and preserve it for another garbage collection
	 * cycle
	 * @param addr The address of the heap item
	 * @param fieldIndex Index of the field to remove from the heap item
	 * @param numToRemove The number of fields to remove, starting at `fieldIndex`
	 */
	public remove(
		addr: number,
		fieldIndex: number,
		numToRemove: number = 1
	): void {
		const itemAddr = this.read(addr);
		const item = this.toSpace[itemAddr];
		if (!item) {
			throw new Error(
				"Garbage collector cannot access heap at resolved index " +
					itemAddr +
					" for index " +
					addr
			);
		}
		if (fieldIndex < 0 || fieldIndex > item.values.length - 1) {
			throw new Error(
				"Garbage collector cannot delete out of bounds index range " +
					fieldIndex +
					" for item with index " +
					addr +
					" (resolved " +
					itemAddr +
					")"
			);
		}
		// Perform the splice:
		item.values = [
			...item.values.slice(0, fieldIndex),
			...item.values.slice(fieldIndex + numToRemove),
		];
	}

	/**
	 * Insert a field inside the specified heap item
	 *
	 * This will copy the heap item and preserve it for another garbage collection
	 * cycle
	 * @param addr The address of the heap item
	 * @param fieldIndex The index of the child value inside the heap item that
	 * will become the index for the first of the inserted values
	 */
	public insert(
		addr: number,
		fieldIndex: number,
		values: RuntimeValue[]
	): void {
		if (values.length < 1) return;
		const itemAddr = this.read(addr);
		const item = this.toSpace[itemAddr];
		if (!item) {
			throw new Error(
				"Garbage collector cannot access heap at resolved index " +
					itemAddr +
					" for index " +
					addr
			);
		}
		if (fieldIndex < 0 || fieldIndex > item.values.length - 1) {
			throw new Error(
				"Garbage collector cannot delete out of bounds index range " +
					fieldIndex +
					" for item with index " +
					addr +
					" (resolved " +
					itemAddr +
					")"
			);
		}
		// Add however many values we are inserting as empty elements
		item.values = [
			...item.values.slice(0, fieldIndex),
			...new Array(values.length),
			...item.values.slice(fieldIndex + 1),
		];
		// Go through each of the empty elements and update its value, which will
		// perform the appropriate garbage collection steps
		let v = 0;
		for (let i = fieldIndex; i < values.length; i++) {
			this.update(addr, i, values[v++]);
		}
	}

	/**
	 * Increase the number of items we need to scan by the specified amount
	 * or however many items are left in the heap
	 * @param amount The amount to increase the number of items to scan by
	 */
	private incNumToScan(amount: number): void {
		const oldNum = this.numToScan;
		const willBeScanned = this.scanPtr + this.numToScan;
		this.numToScan +=
			willBeScanned + amount <= this.config.heapSize
				? amount
				: Math.max(this.config.heapSize - willBeScanned, 0);
		if (this.config.debug) {
			this.log.push(
				"incNumToScan from " + oldNum + " to " + this.numToScan
			);
		}
	}

	/**
	 * Copies a single item from from-space to to-space (if it is not already
	 * copied to to-space) and returns the address of the item in to-space
	 * @param addr The address of the item to copy in from-space
	 */
	private copy(addr: number): number {
		const oldItem = this.fromSpace[addr];
		if (oldItem) {
			if (this.isForwarded(oldItem)) {
				// If item is already forwarded (meaning it is already copied), we
				// should just return the forwarded address
				const forward = oldItem.forwardAddr as number;
				if (this.config.debug) {
					this.log.push(
						"copy forward from " + addr + " to " + forward
					);
				}
				return forward;
			}
			const newAddr = this.copyIntoToSpace(oldItem.values);
			// Set the forwarding address on the old one
			oldItem.forwardAddr = newAddr;
			if (this.config.debug) {
				this.log.push("copy from " + addr + " to " + newAddr);
			}
			return newAddr;
		}
		// Address doesn't exist in from-space so it must be a to-space address
		if (this.config.debug) {
			this.log.push("copy nothing at " + addr);
		}
		return addr;
	}

	/**
	 * Copy a heap item's values into to-space and return the forwarding
	 * address
	 * @param values The values contained in the heap item
	 */
	private copyIntoToSpace(values: RuntimeValue[]): number {
		// Create a copy of the item
		const item: HeapItem = {
			forwardAddr: undefined,
			values, // Don't copy array, use the same reference
		};
		// Place it in to-space:
		const addr = this.allocPtr++;
		if (addr >= this.config.heapSize) throw new Error("Out of memory");
		this.toSpace.push(item);
		return addr;
	}

	/**
	 * Flip "from" and "to" space and reset scan and alloc pointers
	 *
	 * This begins a garbage collection cycle
	 *
	 * Copies roots to the new "to" space
	 *
	 * @param roots The mutator roots--these will be updated accordingly
	 */
	private flip(roots: RuntimeValue[]): void {
		// From-space is assigned to be to-space, deleting all the junk that was in
		// from-space
		this.fromSpace = [...this.toSpace];
		// To-space is reset to be free space
		this.toSpace = [];
		this.scanPtr = 0;
		this.allocPtr = 0;
		this.numToScan = 0;
		if (this.config.debug) {
			this.log.push("flip");
		}
		// Copy all of the roots
		for (let i = 0; i < roots.length; i++) {
			const root = roots[i];
			if (
				root.isPointer &&
				typeof root.value !== "undefined" &&
				root.value !== null
			) {
				// Replace this pointer with the correct pointer to the new item
				// located in to-space:
				roots[i] = new RuntimeValue(
					root.type,
					this.copy(root.value as number)
				);
				this.incNumToScan(this.config.numScanPerRoot);
			}
		}
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
			if (this.config.debug) {
				this.log.push("scan " + addr);
			}
			// Scan each field in the item
			this.scanItem(item);
			// Decrease how many items we need to scan
			this.numToScan -= 1;
		}
	}

	/**
	 * Scan a single item
	 * @param item The heap item to scan
	 */
	private scanItem(item: HeapItem): void {
		for (let i = 0; i < item.values.length; i++) {
			const value = item.values[i];
			if (
				value.isPointer &&
				typeof value.value !== "undefined" &&
				value.value !== null
			) {
				// Item contains a pointer--copy the thing it is pointing to (if
				// needed) and update the pointer
				item.values[i] = new RuntimeValue(
					value.type,
					this.copy(value.value as number)
				);
			}
		}
	}

	/** True if the specified heap item has a forwarding address */
	private isForwarded(item: HeapItem): boolean {
		return typeof item.forwardAddr !== "undefined";
	}

	private _heapDescription(heap: HeapItem[]): string {
		let desc = (heap === this.toSpace ? "TO-SPACE" : "FROM-SPACE") + ":\n";
		for (let i = 0; i < heap.length; i++) {
			const item = heap[i];
			desc += String(i).padStart(4, "0");
			if (heap === this.toSpace && this.updated.has(i)) desc += "*";
			if (item.values.length > 0) desc += ":";
			desc += "\n";
			for (const value of item.values) {
				desc += "    " + value.description + "\n";
			}
		}
		return desc;
	}

	// MARK: Describable

	public get description(): string {
		return (
			"GC (" +
			GCState[this.state] +
			")\n" +
			this.log
				.map((l, i) => String(i).padStart(4, "0") + ": " + l)
				.join("\n") +
			"\n" +
			this._heapDescription(this.fromSpace) +
			" ----------- \n" +
			this._heapDescription(this.toSpace)
		);
	}
}
