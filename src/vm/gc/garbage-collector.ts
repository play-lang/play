import { Exception } from "src/common/exception";
import { GCData, GCDataType, GCDataTypeKey } from "src/vm/gc/gc-data";
import { VMType } from "src/vm/vm-type";
import { VMValue } from "src/vm/vm-value";

/** Represents a single heap cell containing data */
export class Cell {
	public constructor(
		/** Array of values contained in this heap cell */
		public values: GCData,
		/** Forwarding address of the cell in to-space, if any */
		public fwd?: number
	) {}

	/** True if the cell is forwarded */
	public get hasFwd(): boolean {
		return typeof this.fwd !== "undefined";
	}
}

/** Garbage collector settings */
export interface GCConfig {
	/** Garbage collector heap size */
	heapSize: number;
}

/** Garbage collector initialization options */
export type GCInitConfig = Partial<GCConfig>;

const defaults: GCConfig = {
	heapSize: 2048,
};

enum GCErrors {
	OutOfMemory = "Out of Memory",
	ScanningIncomplete = "Scanning Incomplete",
	InvalidPointer = "Invalid Pointer",
	InvalidListOperation = "Invalid List Operation",
	InvalidMapOperation = "Invalid Map Operation",
}

export class GCError extends Exception {
	constructor(type: GCErrors) {
		super(type);
	}
}

/**
 * A simple implementation of an incremental copying/compacting garbage
 * collector utilizing Baker's algorithm with a read barrier (and Cheney's
 * copying algorithm)
 *
 * Note that this is not a real-time collector—it is only incremental and the
 * allocation times are not bounded as memory increases
 *
 * It is fairly conservative, so garbage created in one cycle cannot be
 * collected until the next cycle (floating garbage)
 *
 * This essentially performs a little bit of garbage collection every time new
 * heap space is allocated
 *
 * Made possible by the following book:
 * *Garbage Collection: Algorithms for Automatic and Dynamic Memory Management*
 * by Richard Jones and Rafael Lins (© 1996)
 */
export class GarbageCollector {
	/** From-space */
	public fromSpace: Cell[];
	/** To-space */
	public toSpace: Cell[];

	/** The address of the next cell to be scanned in to-space */
	private scanPtr: number = 0;
	/** The address of the next cell to be copied into to-space */
	private evacPtr: number = 0;
	/** The address of the next cell to be allocated in to-space */
	private allocPtr: number;
	/** True if garbage collection has happened at least once */
	private hasFlipped: boolean = false;

	/** Size of each heap space */
	public get heapSize(): number {
		return Math.floor(this.config.heapSize / 2);
	}

	/** True if there are is no more memory available in to-space */
	public get outOfMemory(): boolean {
		return this.evacPtr > this.allocPtr;
	}

	/** Number of active cells (how much memory is being used) */
	public get numActiveCells(): number {
		// Compute number of active cells by adding all the scanned,
		// waiting-to-be-scanned, and newly allocated cells up
		return this.evacPtr + (this.heapSize - (this.allocPtr + 1));
	}

	/** Number of cells to scan per allocation */
	public get numToScan(): number {
		// Compute number of cells to scan per allocation to prevent mutator
		// from starving (p. 184 in Garbage Collection by Jones & Lins)
		return Math.ceil(
			this.numActiveCells / (this.heapSize - this.numActiveCells)
		);
	}

	/** Garbage collector settings */
	private config: GCConfig;

	// MARK: Constructor and Public Methods

	constructor(settings?: GCInitConfig) {
		this.config = { ...defaults, ...settings };
		this.fromSpace = new Array<Cell>(this.heapSize);
		this.toSpace = new Array<Cell>(this.heapSize);
		this.allocPtr = this.heapSize - 1;
	}

	/** Read a runtime value from the heap */
	public heap(addr: number, index: GCDataTypeKey): VMValue | undefined {
		return this.toSpace[addr].values.get(index);
	}

	/**
	 * Update a value contained inside a heap cell
	 *
	 * For lists, `index` represents the numeric index into the array
	 * For maps, `index` represents the string key to update
	 * For sets, `index` represents the old value to remove from the set
	 */
	public update(addr: number, index: GCDataTypeKey, value: VMValue): void {
		this.toSpace[addr].values.update(index, value);
	}

	/**
	 * Allocate a cell of space on the heap to hold the specified values
	 *
	 * This will perform some garbage collection if necessary
	 *
	 * @param values Values to be contained in the new cell (either an array or
	 * a map)
	 * @param roots Current mutator roots, in case garbage collection is initiated
	 */
	public alloc(values: GCDataType, roots: VMValue[]): number {
		if (this.outOfMemory) {
			/* istanbul ignore next */
			if (this.scanPtr < this.evacPtr) {
				// Theoretically shouldn't ever happen
				throw new GCError(GCErrors.ScanningIncomplete);
			}
			// We're out of heap space
			this.flip(roots);
		}
		let k = this.numToScan;
		// Do a little bit of scanning
		while (k > 0 && this.scanPtr < this.evacPtr) {
			// Scan each cell
			this.scan();
			k--;
		}
		if (this.outOfMemory) {
			// Still out of memory after copying roots
			throw new GCError(GCErrors.OutOfMemory);
		}
		this.toSpace[this.allocPtr] = new Cell(new GCData(values));
		return this.allocPtr--;
	}

	/**
	 * Remove a child value from the list cell at the specified index
	 * @param addr Address of the cell—must be resolved via read() first
	 * @param offset Index at which to remove the value(s)
	 * @param numToRemove The number of items to remove
	 */
	public remove(
		addr: number,
		offset: number,
		numToRemove: number = 1
	): boolean {
		if (numToRemove < 1) return false;
		const cell = this.toSpace[addr];
		if (!cell || offset < 0 || offset > cell.values.length) {
			throw new GCError(GCErrors.InvalidPointer);
		}
		if (!Array.isArray(cell.values.data)) {
			throw new GCError(GCErrors.InvalidListOperation);
		}
		const oldLength = cell.values.length;
		cell.values = new GCData([
			...cell.values.data.slice(0, offset),
			...cell.values.data.slice(offset + numToRemove),
		]);
		return oldLength !== cell.values.length;
	}

	/**
	 * Insert a child value in a list cell at the specified index
	 * @param addr Address of the cell—must be resolved via read() first
	 * @param values Values to insert
	 * @param offset Index at which to insert the new value(s)
	 */
	public insert(addr: number, values: VMValue[], offset?: number): void {
		if (values.length < 1) return;
		const cell = this.toSpace[addr];
		if (
			!cell ||
			(typeof offset === "number" &&
				(offset < 0 || offset > cell.values.length))
		) {
			throw new GCError(GCErrors.InvalidPointer);
		}
		if (!Array.isArray(cell.values.data)) {
			throw new GCError(GCErrors.InvalidListOperation);
		}
		if (typeof offset !== "number") offset = cell.values.length;
		cell.values = new GCData([
			...cell.values.data.slice(0, offset),
			...[...values],
			...cell.values.data.slice(offset + 1),
		]);
		return;
	}

	/**
	 * Delete an entry from a map cell with the specified key
	 * @param addr Address of the cell—must be resolved via read() first
	 * @param key Key to delete in the cell's values
	 */
	public delete(addr: number, key: string): boolean {
		const cell = this.toSpace[addr];
		if (!cell) throw new GCError(GCErrors.InvalidPointer);
		if (!(cell.values.data instanceof Map)) {
			throw new GCError(GCErrors.InvalidMapOperation);
		}
		return cell.values.data.delete(key);
	}

	/**
	 * Set or update an entry's value in a map cell
	 * @param addr Address of the cell—must be resolved via read() first
	 * @param key Key to set in the cell's values
	 * @param value The value to set in the cell's values
	 */
	public set(addr: number, key: string, value: VMValue): void {
		const cell = this.toSpace[addr];
		if (!cell) throw new GCError(GCErrors.InvalidPointer);
		if (!(cell.values.data instanceof Map)) {
			throw new GCError(GCErrors.InvalidMapOperation);
		}
		cell.values.data.set(key, value);
	}

	/** Collect all garbage, stop-the-world style */
	public collect(roots: VMValue[]): void {
		this.flip(roots);
		while (this.scanPtr < this.evacPtr) {
			this.scan();
		}
	}

	/**
	 * Read barrier that copies any pointers read
	 *
	 * Mutator should update the pointer according to the value returned here
	 *
	 * Baker's read barrier does not require us to implement a write barrier
	 */
	public read(addr: number): number {
		return this.copy(
			this.hasFlipped ? this.fromSpace[addr] : this.toSpace[addr]
		);
	}

	/** Scan the next cell waiting to be scanned */
	private scan(): void {
		const cell = this.toSpace[this.scanPtr++];
		for (const v of cell.values.keys()) {
			const value = cell.values.get(v)!;
			if (value.isPointer && typeof value.value === "number") {
				cell.values.update(
					v,
					new VMValue(
						VMType.Pointer,
						this.copy(this.fromSpace[value.value as number])
					)
				);
			}
		}
	}

	/** Start garbage collection by flipping the heap semi-spaces */
	private flip(roots: VMValue[]): void {
		this.hasFlipped = true;
		this.fromSpace = this.toSpace;
		this.toSpace = new Array<Cell>(this.heapSize);
		this.scanPtr = 0;
		this.evacPtr = 0;
		// Allocate from the end of the heap towards the start
		this.allocPtr = this.heapSize - 1;
		let r = 0;
		// Copy and update root set
		for (const root of roots) {
			if (root.isPointer && typeof root.value === "number") {
				roots[r++] = new VMValue(
					VMType.Pointer,
					this.copy(this.fromSpace[root.value as number])
				);
			}
		}
	}

	/**
	 * Copy a cell from from-space into to-space, leaving behind a forwarding
	 * address in from-space
	 */
	private copy(cell: Cell): number {
		// If this cell is already forwarded it need not be copied
		if (cell.hasFwd) return cell.fwd!;
		// Create a copy of the cell without a forwarding address and put it in
		// to-space
		this.toSpace[this.evacPtr] = new Cell(new GCData(cell.values.data));
		// Update the forwarding address of the old cell
		cell.fwd = this.evacPtr++;
		// Return the address of the cell's copy in to-space
		return cell.fwd;
	}

	/*
	private _heapDescription(heap: Cell[]): string {
		let desc = (heap === this.toSpace ? "TO-SPACE" : "FROM-SPACE") + ":\n";
		for (let i = 0; i < heap.length; i++) {
			const cell = heap[i];
			if (cell) {
				desc += String(i).padStart(4, "0");
				if (cell.hasFwd) {
					desc += " (" + String(cell.fwd as number) + ")";
				}
				if (cell.values.length > 0) desc += ":";
				desc += "\n";
				for (const [v, value] of cell.values) {
					desc += "    " + String(v) + ": " + value.description + "\n";
				}
			}
		}
		return desc;
	}

	// MARK: Describable

	public get description(): string {
		return (
			"GC\n" +
			// this.log
			// 	.map((l, i) => String(i).padStart(4, "0") + ": " + l)
			// 	.join("\n") +
			// "\n" +
			this._heapDescription(this.fromSpace) +
			"----------- \n" +
			this._heapDescription(this.toSpace)
		);
	}
	*/
}
