import { Describable } from "src/common/describable";
import { RuntimeType } from "src/vm/runtime-type";
import { RuntimeValue } from "src/vm/runtime-value";

class Cell {
	public constructor(
		/** Array of values contained in this heap cell */
		public values: RuntimeValue[],
		/** Forwarding address of the cell in to-space, if any */
		public fwd?: number
	) {}

	/** True if the cell is forwarded */
	public get hasFwd(): boolean {
		return typeof this.fwd !== "undefined";
	}
}

export interface GCConfig {
	/** Garbage collector heap size */
	heapSize: number;
	/** True if diagnostics logging should be enabled */
	debug: boolean;
}

/** Garbage collector initialization options */
export type GCInitConfig = Partial<GCConfig>;

const defaults: GCConfig = {
	heapSize: 2048,
	debug: true,
};

/**
 * Simple, abstracted implementation of an incremental Baker copying/compacting
 * garbage collector
 *
 * Made possible by the following book:
 * *Garbage Collection: Algorithms for Automatic and Dynamic Memory Management*
 * by Richard Jones and Rafael Lins (© 1996)
 */
export class GarbageCollector implements Describable {
	/** From-space */
	public fromSpace: Cell[];
	/** To-space */
	public toSpace: Cell[];

	private scan: number = 0;
	private evac: number = 0;
	private alloc: number;
	private hasFlipped: boolean = false;

	/** Size of each heap space */
	public get heapSize(): number {
		return Math.floor(this.config.heapSize / 2);
	}

	/** Garbage collector settings */
	private config: GCConfig;

	// MARK: Constructor and Public Methods

	constructor(settings?: GCInitConfig) {
		this.config = { ...defaults, ...settings };
		this.fromSpace = new Array<Cell>(this.heapSize);
		this.toSpace = new Array<Cell>(this.heapSize);
		this.alloc = this.heapSize - 1;
	}

	public allocate(values: RuntimeValue[], roots: RuntimeValue[]): number {
		if (this.evac >= this.alloc - 1) {
			if (this.scan < this.evac) {
				throw new Error("Scanning incomplete");
			}
			// We're out of heap space
			this.flip(roots);
		}
		// if (this.hasFlipped) {
		// Compute number of active cells by adding all the scanned,
		// waiting-to-be-scanned, and newly allocated cells up
		const activeCells = this.evac + (this.heapSize - this.alloc);
		// Compute number of cells to scan per allocation to prevent mutator
		// from starving (p. 184 in Garbage Collection by Jones & Lins)
		const k = Math.ceil(activeCells / (this.heapSize - activeCells));
		// Do a little bit of scanning
		while (k > 0 && this.scan < this.evac) {
			// Scan each cell
			const cell = this.toSpace[this.scan++];
			for (let v = 0; v < cell.values.length; v++) {
				const value = cell.values[v];
				if (value.isPointer) {
					cell.values[v] = new RuntimeValue(
						RuntimeType.Pointer,
						this.copy(this.fromSpace[value.value as number])
					);
				}
			}
		}
		// }

		if (this.evac === this.alloc) {
			throw new Error("Heap full");
		}
		this.toSpace[this.alloc] = new Cell(values);
		return this.alloc--;
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

	private flip(roots: RuntimeValue[]): void {
		this.hasFlipped = true;
		this.fromSpace = this.toSpace;
		this.toSpace = new Array<Cell>(this.heapSize);
		this.scan = 0;
		this.evac = 0;
		// Allocate from the end of the heap towards the start
		this.alloc = this.heapSize - 1;
		let r = 0;
		// Copy and update root set
		for (const root of roots) {
			if (root.isPointer) {
				roots[r++] = new RuntimeValue(
					RuntimeType.Pointer,
					this.copy(this.fromSpace[root.value as number])
				);
			}
		}
	}

	private copy(cell: Cell): number {
		// If this cell is already forwarded it need not be copied
		if (cell.hasFwd) return cell.fwd!;
		// Create a copy of the cell without a forwarding address and put it in
		// to-space
		this.toSpace[this.evac++] = new Cell(cell.values);
		// Update the forwarding address of the old cell
		cell.fwd = this.toSpace.length - 1;
		// Return the address of the cell's copy in to-space
		return cell.fwd;
	}

	private _heapDescription(heap: Cell[]): string {
		let desc = (heap === this.toSpace ? "TO-SPACE" : "FROM-SPACE") + ":\n";
		for (let i = 0; i < heap.length; i++) {
			const cell = heap[i];
			if (cell) {
				desc += String(i).padStart(4, "0");
				// if (heap === this.toSpace && this.updated.has(i)) desc += "*";
				if (cell.values.length > 0) desc += ":";
				desc += "\n";
				const j = 0;
				for (const value of cell.values) {
					desc +=
						"    " +
						String(j).padStart(4) +
						": " +
						value.description +
						"\n";
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
			" ----------- \n" +
			this._heapDescription(this.toSpace)
		);
	}
}
