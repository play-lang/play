import { Describable } from "src/common/describable";
import { RuntimePointer } from "src/vm/runtime-pointer";
import { RuntimeType } from "src/vm/runtime-type";
import { RuntimeValue } from "src/vm/runtime-value";

interface Cell {
	/** Array of values contained in this heap cell */
	values: RuntimeValue[];
	/** Forwarding address of the cell in to-space, if any */
	fwd: number | undefined;
}

enum State {
	/** Garbage collection is finished or has never been started */
	Starting,
	/** Scanning and copying cells */
	Scanning,
	/** Cleaning up */
	Idle,
}

interface Config {
	/** Garbage collector heap size */
	heapSize: number;
	/** Number of items to scan during each increment of garbage collection */
	numScanPerInc: number;
	/** True if diagnostics logging should be enabled */
	debug: boolean;
}

/** Garbage collector initialization options */
export type GCInitConfig = Partial<Config>;

const defaults: Config = {
	heapSize: 1024,
	numScanPerInc: 2,
	debug: true,
};

export class GarbageCollector implements Describable {
	/** From-space */
	public fromSpace: Cell[] = [];
	/** To-space */
	public toSpace: Cell[] = [];

	/** True if actively collecting garbage */
	public get isCollecting(): boolean {
		return this.state !== State.Idle;
	}

	// MARK: Private fields

	/** Number of allocations made since the last collection cycle */
	private numAllocs: number = 0;
	/** Number of allocations needed (since last cycle to trigger collection  */
	private numAllocsRequired: number;
	/** Address of next cell to scan in to-space */
	private scanPtr: number = 0;
	/** Garbage collection state */
	private state: State = State.Idle;
	/**
	 * List of cells that were updated by the mutator after they were scanned
	 * while a collection is active
	 */
	private updated: Set<number> = new Set();
	/** Garbage collector settings */
	private config: Config;

	// MARK: Constructor and Public Methods

	constructor(settings?: GCInitConfig) {
		this.config = { ...defaults, ...settings };
		this.numAllocsRequired = this.config.heapSize;
	}

	public alloc(values: RuntimeValue[], roots: RuntimeValue[]): RuntimeValue {
		if (++this.numAllocs >= this.numAllocsRequired && !this.isCollecting) {
			// Start garbage collection by copying roots
			this.flip(roots);
		}
		// Copy cell into to-space
		this.toSpace.push({ values, fwd: undefined });
		// Collect some garbage, if necessary:
		this.collect();
		// Return a to-space pointer to the newly allocated cell
		return this.makeToSpacePointerValue(this.toSpace.length - 1);
	}

	public update(
		ptr: RuntimePointer,
		offset: number,
		value: RuntimeValue
	): void {
		// Nothing to do if given a null pointer:
		if (typeof ptr.addr === "undefined") return;
		// If the replacement value we're given is a pointer, we need to resolve
		// what it points to
		const newValue = this.shouldUpdatePointerValue(value)
			? this.makePointerValue(this.resolve(value.value as RuntimePointer))
			: value.copy();
		// Resolve the address of the requested object
		const newPtr = this.resolve(ptr);
		if (ptr.toSpace || this.hasFwdAddr(ptr)) {
			// Pointer points to a to-space location
			if (this.scanPtr > newPtr.addr!) {
				// To-space location referenced by pointer has already been scanned
				// We need to scan it again since we are mutating it during a
				// collection cycle
				this.updated.add(newPtr.addr!);
			}
		}
		// Update the child value
		this.toSpace[newPtr.addr!].values[offset] = newValue;
	}

	public read(value: RuntimeValue): RuntimeValue {
		if (!value.isPointer || !(value.value instanceof RuntimePointer)) {
			return value;
		}
		return this.makePointerValue(this.resolve(value.value));
	}

	/**
	 * Collect all garbage (stops the world to do so)
	 */
	public collectAll(roots: RuntimeValue[]): void {
		if (!this.isCollecting) this.flip(roots);
		while (this.state !== State.Idle) {
			this.collect();
		}
	}

	// MARK: Private methods

	private collect(): void {
		switch (this.state) {
			case State.Idle:
				return;
			case State.Starting:
				this.state = State.Scanning;
				return;
			case State.Scanning:
				this.scanSome(this.config.numScanPerInc);
				if (this.scanPtr >= this.fromSpace.length) {
					this.state = State.Idle;
				}
				return;
		}
	}

	/**
	 * Start garbage collection by flipping the heaps, as is typical for a
	 * copying collector
	 *
	 * @param roots The root set
	 */
	private flip(roots: RuntimeValue[]): void {
		// Don't run garbage collection again until the number of allocations
		this.state = State.Starting;
		// doubles
		this.numAllocsRequired = 2 * this.numAllocsRequired;
		this.numAllocs = 0;
		// Flip the heaps
		this.fromSpace = this.toSpace;
		this.toSpace = [];
		this.scanPtr = 0;
		// Walk through all of the roots and copy the pointed-to cells into to-space
		// while also updating the root pointers themselves
		for (let i = 0; i < roots.length; i++) {
			const root = roots[i];
			if (this.shouldUpdatePointerValue(root)) {
				roots[i] = this.makePointerValue(
					this.resolve(root.value as RuntimePointer)
				);
			}
		}
	}

	/**
	 * Resolves the specified pointer
	 *
	 * If the specified pointer points to a cell in from-space that has not
	 * yet been copied into to-space, this will copy the cell and return the
	 * to-space pointer to it
	 *
	 * Otherwise, the same pointer given is returned
	 * @param ptr The pointer to examine
	 */
	private resolve(ptr: RuntimePointer): RuntimePointer {
		// If the pointer is a null pointer, return a to-space null pointer
		if (typeof ptr.addr === "undefined") {
			return new RuntimePointer(true, undefined);
		}
		if (!ptr.toSpace) {
			// Pointer points to from-space
			// We must be actively collecting garbage
			if (typeof this.fromSpace[ptr.addr].fwd !== "undefined") {
				// From space cell has fwd address
				return new RuntimePointer(true, this.fromSpace[ptr.addr].fwd);
			}
			// No forwarding pointer, copy the cell and return a new
			// to-space pointer with the address of the copied cell
			this.fromSpace[ptr.addr].fwd = this.copy(ptr).addr;
			return new RuntimePointer(true, this.fromSpace[ptr.addr].fwd);
		}
		// Pointer represents a cell in to-space, leave it as-is
		return ptr;
	}

	/**
	 * Copies a from-space pointer into to-space and returns the new pointer
	 *
	 * If the cell is not in from-space, the same pointer will be returned.
	 * @param ptr The pointer representing the cell to be copied
	 */
	private copy(ptr: RuntimePointer): RuntimePointer {
		// If the pointer is a null pointer or points to a cell in to-space,
		// we can just return it
		if (ptr.toSpace || typeof ptr.addr === "undefined") return ptr;
		if (!ptr.toSpace && this.hasFwdAddr(ptr)) {
			// Pointer points to from-space but the cell it points to has
			// a forwarding address—we can just return that
			return new RuntimePointer(true, this.fromSpace[ptr.addr!].fwd);
		}
		// Pointer must be in from-space but not copied into to-space
		// We must be actively collecting garbage
		const cell = this.fromSpace[ptr.addr];
		if (!cell) return ptr;
		this.toSpace.push({
			values: cell.values,
			fwd: undefined,
		});
		cell.fwd = this.toSpace.length - 1;
		return new RuntimePointer(true, cell.fwd);
	}

	/**
	 * Scans cells for garbage collection
	 */
	private scanSome(numToScan: number): void {
		while (this.scanPtr < this.fromSpace.length && numToScan > 0) {
			this.scan(this.scanPtr++);
			--numToScan;
		}
	}

	/**
	 * Scan the contents of a cell in from-space
	 *
	 * This will resolve all from-space child pointers to to-space pointers by
	 * copying any cells that this cell refers to that are not themselves
	 * stored in to-space
	 *
	 * @param addr The address of the cell to scan in from-space
	 */
	private scan(addr: number): void {
		const cell = this.fromSpace[addr];
		if (!cell) return;
		for (let i = 0; i < cell.values.length; i++) {
			if (this.shouldUpdatePointerValue(cell.values[i])) {
				cell.values[i] = this.makePointerValue(
					this.resolve(cell.values[i].value as RuntimePointer)
				);
			}
		}
	}

	/**
	 * Returns true if the specified root value is a pointer that
	 * represents a cell in from-space
	 * @param value A root runtime value
	 */
	private shouldUpdatePointerValue(value: RuntimeValue): boolean {
		return (
			value.isPointer &&
			value.value instanceof RuntimePointer &&
			!value.value.toSpace
		);
	}

	/**
	 * Returns true if the specified pointer is a from-space pointer with
	 * a forwarding address
	 * @param ptr The pointer to examine
	 */
	private hasFwdAddr(ptr: RuntimePointer): boolean {
		if (ptr.toSpace || typeof ptr.addr === "undefined") return false;
		return typeof this.fromSpace[ptr.addr].fwd !== "undefined";
	}

	/**
	 * Makes a runtime value containing a runtime pointer to the specified
	 * address in to-space
	 * @param addr The dest address in to-space
	 */
	private makeToSpacePointerValue(addr: number): RuntimeValue {
		return new RuntimeValue(
			RuntimeType.Pointer,
			new RuntimePointer(true, addr)
		);
	}

	/**
	 * Creates a RuntimeValue to hold the specified pointer
	 * @param ptr The pointer to wrap in a RuntimeValue
	 */
	private makePointerValue(ptr: RuntimePointer): RuntimeValue {
		return new RuntimeValue(RuntimeType.Pointer, ptr);
	}

	private _heapDescription(heap: Cell[]): string {
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
			State[this.state] +
			")\n" +
			// this.log
			// 	.map((l, i) => String(i).padStart(4, "0") + ": " + l)
			// 	.join("\n") +
			// "\n" +
			this._heapDescription(this.fromSpace) +
			" ----------- \n" +
			this._heapDescription(this.toSpace)
		);
	}
}
