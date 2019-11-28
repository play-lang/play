import { AvlTree, Node } from "../src/common/avl-tree";

class TestAvlTree<K, V> extends AvlTree<K, V> {
	public get root(): Node<K, V> | null {
		return this._root;
	}
}

describe("avl-tree", () => {
	/** Additional Tests for Bounds added by Joe */
	it("should find lower bound", () => {
		const tree = new TestAvlTree();
		expect(tree.findLowerBound(17)).toBe(null);
		tree.insert(50);
		tree.insert(5);
		tree.insert(35);
		tree.insert(10);
		tree.insert(20);
		tree.insert(15);
		// Tree contains 5, 10, 15, 20, 35, 50
		expect(tree.findLowerBound(17)).toBe(15);
		expect(tree.findLowerBound(45)).toBe(35);
		expect(tree.findLowerBound(199)).toBe(50);
		expect(tree.findLowerBound(3)).toBe(null);
		expect(tree.findLowerBound(-20)).toBe(null);
		expect(tree.findLowerBound(12)).toBe(10);
		expect(tree.findLowerBound(1000)).toBe(50);
		expect(tree.findLowerBound(36)).toBe(35);
		expect(tree.findLowerBound(5)).toBe(5);
		expect(tree.findLowerBound(10)).toBe(10);
		expect(tree.findLowerBound(15)).toBe(15);
		expect(tree.findLowerBound(20)).toBe(20);
		expect(tree.findLowerBound(35)).toBe(35);
		expect(tree.findLowerBound(50)).toBe(50);
	});

	/** Tests created by AVL Tree author */
	it("should return false if the tree is empty", () => {
		const tree = new TestAvlTree();
		expect(tree.contains(1)).toBe(false);
	});

	it("should return whether the tree contains a node", () => {
		const tree = new TestAvlTree();
		expect(tree.contains(1)).toBe(false);
		expect(tree.contains(2)).toBe(false);
		expect(tree.contains(3)).toBe(false);
		tree.insert(3);
		tree.insert(1);
		tree.insert(2);
		expect(tree.contains(1)).toBe(true);
		expect(tree.contains(2)).toBe(true);
		expect(tree.contains(3)).toBe(true);
	});

	it("should return false when the expected parent has no children", () => {
		const tree = new TestAvlTree();
		tree.insert(2);
		expect(tree.contains(1)).toBe(false);
		expect(tree.contains(3)).toBe(false);
	});

	it("should function correctly given a non-reverse customCompare", () => {
		const tree = new TestAvlTree<number, null>((a, b) => b - a);
		tree.insert(2);
		tree.insert(1);
		tree.insert(3);
		expect(tree.size).toBe(3);
		expect(tree.findMinimum()).toBe(3);
		expect(tree.findMaximum()).toBe(1);
		tree.delete(3);
		expect(tree.size).toBe(2);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(2);
		expect(tree.root!.left!).toBe(null);
		expect(tree.root!.right!).toBeTruthy();
		expect(tree.root!.right!.key).toBe(1);
	});

	it("should work when the key is a complex object", () => {
		interface IComplexObject {
			innerKey: number;
		}
		const tree = new TestAvlTree<IComplexObject, null>(
			(a, b) => a.innerKey - b.innerKey
		);
		tree.insert({ innerKey: 1 });
		expect(tree.contains({ innerKey: 1 })).toBe(true);
		expect(tree.contains({ innerKey: 2 })).toBe(false);
	});

	it("should return null when the tree is empty", () => {
		const tree = new TestAvlTree();
		expect(tree.findMaximum()).toBe(null);
	});

	it("should return the maximum key in the tree", () => {
		const tree = new TestAvlTree();
		tree.insert(3);
		tree.insert(5);
		tree.insert(1);
		tree.insert(4);
		tree.insert(2);
		expect(tree.findMaximum()).toBe(5);
	});

	it("should return null when the tree is empty", () => {
		const tree = new TestAvlTree();
		expect(tree.findMinimum()).toBe(null);
	});

	it("should return the minimum key in the tree", () => {
		const tree = new TestAvlTree();
		tree.insert(5);
		tree.insert(3);
		tree.insert(1);
		tree.insert(4);
		tree.insert(2);
		expect(tree.findMinimum()).toBe(1);
	});

	it("should return the correct values", () => {
		const tree = new TestAvlTree();
		tree.insert(1, 4);
		tree.insert(2, 5);
		tree.insert(3, 6);
		expect(tree.get(1)).toBe(4);
		expect(tree.get(2)).toBe(5);
		expect(tree.get(3)).toBe(6);
	});

	it("should return null when the value doesn't exist", () => {
		const tree = new TestAvlTree();
		expect(tree.get(1)).toBe(null);
		expect(tree.get(2)).toBe(null);
		expect(tree.get(3)).toBe(null);
		tree.insert(1, 4);
		tree.insert(2, 5);
		tree.insert(3, 6);
		expect(tree.get(4)).toBe(null);
		expect(tree.get(5)).toBe(null);
		expect(tree.get(6)).toBe(null);
	});

	it("should return whether the tree is empty", () => {
		const tree = new TestAvlTree();
		expect(tree.isEmpty).toBe(true);
		tree.insert(1);
		expect(tree.isEmpty).toBe(false);
		tree.delete(1);
		expect(tree.isEmpty).toBe(true);
	});

	it("should return the size of the tree", () => {
		const tree = new TestAvlTree();
		expect(tree.size).toBe(0);
		tree.insert(1);
		expect(tree.size).toBe(1);
		tree.insert(2);
		expect(tree.size).toBe(2);
		tree.insert(3);
		expect(tree.size).toBe(3);
		tree.insert(4);
		expect(tree.size).toBe(4);
		tree.insert(5);
		expect(tree.size).toBe(5);
		tree.insert(6);
		expect(tree.size).toBe(6);
		tree.insert(7);
		expect(tree.size).toBe(7);
		tree.insert(8);
		expect(tree.size).toBe(8);
		tree.insert(9);
		expect(tree.size).toBe(9);
		tree.insert(10);
		expect(tree.size).toBe(10);
	});
});

describe("avl tree delete", () => {
	it("should not change the size of a tree with no root", () => {
		const tree = new TestAvlTree();
		tree.delete(1);
		expect(tree.size).toBe(0);
	});

	it("should delete a single key", () => {
		const tree = new TestAvlTree();
		tree.insert(1);
		tree.delete(1);
		expect(tree.isEmpty).toBe(true);
	});

	/**
	 *       _4_                       _2_
	 *      /   \                     /   \
	 *     2     6  -> delete(6) ->  1     4
	 *    / \                             /
	 *   1   3                           3
	 */
	it("should correctly balance the left left case", () => {
		const tree = new TestAvlTree();
		tree.insert(4, 4);
		tree.insert(2, 2);
		tree.insert(6, 6);
		tree.insert(3, 3);
		tree.insert(5, 5);
		tree.insert(1, 1);
		tree.insert(7, 7);
		tree.delete(7);
		tree.delete(5);
		tree.delete(6);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(2);
		expect(tree.root!.value).toBe(2);
		expect(tree.root!.left!).toBeTruthy();
		expect(tree.root!.left!.key).toBe(1);
		expect(tree.root!.left!.value).toBe(1);
		expect(tree.root!.right!).toBeTruthy();
		expect(tree.root!.right!.key).toBe(4);
		expect(tree.root!.right!.value).toBe(4);
		expect(tree.root!.right!.left!).toBeTruthy();
		expect(tree.root!.right!.left!.key).toBe(3);
		expect(tree.root!.right!.left!.value).toBe(3);
	});

	/**
	 *       _4_                       _6_
	 *      /   \                     /   \
	 *     2     6  -> delete(2) ->  4     7
	 *          / \                   \
	 *         5   7                  5
	 */
	it("should correctly balance the right right case", () => {
		const tree = new TestAvlTree();
		tree.insert(4, 4);
		tree.insert(2, 2);
		tree.insert(6, 6);
		tree.insert(3, 3);
		tree.insert(5, 5);
		tree.insert(1, 1);
		tree.insert(7, 7);
		tree.delete(1);
		tree.delete(3);
		tree.delete(2);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(6);
		expect(tree.root!.value).toBe(6);
		expect(tree.root!.left!).toBeTruthy();
		expect(tree.root!.left!.key).toBe(4);
		expect(tree.root!.left!.value).toBe(4);
		expect(tree.root!.left!.right!).toBeTruthy();
		expect(tree.root!.left!.right!.key).toBe(5);
		expect(tree.root!.left!.right!.value).toBe(5);
		expect(tree.root!.right!).toBeTruthy();
		expect(tree.root!.right!.key).toBe(7);
		expect(tree.root!.right!.value).toBe(7);
	});

	/**
	 *       _6_                       _4_
	 *      /   \                     /   \
	 *     2     7  -> delete(8) ->  2     6
	 *    / \     \                 / \   / \
	 *   1   4     8               1   3 5   7
	 *      / \
	 *     3   5
	 */
	it("should correctly balance the left right case", () => {
		const tree = new TestAvlTree();
		tree.insert(6, 6);
		tree.insert(2, 2);
		tree.insert(7, 7);
		tree.insert(1, 1);
		tree.insert(8, 8);
		tree.insert(4, 4);
		tree.insert(3, 3);
		tree.insert(5, 5);
		tree.delete(8);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(4);
		expect(tree.root!.value).toBe(4);
		expect(tree.root!.left!).toBeTruthy();
		expect(tree.root!.left!.key).toBe(2);
		expect(tree.root!.left!.value).toBe(2);
		expect(tree.root!.left!.left!).toBeTruthy();
		expect(tree.root!.left!.left!.key).toBe(1);
		expect(tree.root!.left!.left!.value).toBe(1);
		expect(tree.root!.left!.right!).toBeTruthy();
		expect(tree.root!.left!.right!.key).toBe(3);
		expect(tree.root!.left!.right!.value).toBe(3);
		expect(tree.root!.right!).toBeTruthy();
		expect(tree.root!.right!.key).toBe(6);
		expect(tree.root!.right!.value).toBe(6);
		expect(tree.root!.right!.left!).toBeTruthy();
		expect(tree.root!.right!.left!.key).toBe(5);
		expect(tree.root!.right!.left!.value).toBe(5);
		expect(tree.root!.right!.right!).toBeTruthy();
		expect(tree.root!.right!.right!.key).toBe(7);
		expect(tree.root!.right!.right!.value).toBe(7);
	});

	/**
	 *       _3_                       _5_
	 *      /   \                     /   \
	 *     2     7  -> delete(1) ->  3     7
	 *    /     / \                 / \   / \
	 *   1     5   8               2   4 6   8
	 *        / \
	 *       4   6
	 */
	it("should correctly balance the right left case", () => {
		const tree = new TestAvlTree();
		tree.insert(3, 3);
		tree.insert(2, 2);
		tree.insert(7, 7);
		tree.insert(1, 1);
		tree.insert(8, 8);
		tree.insert(5, 5);
		tree.insert(4, 4);
		tree.insert(6, 6);
		tree.delete(1);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(5);
		expect(tree.root!.value).toBe(5);
		expect(tree.root!.left!).toBeTruthy();
		expect(tree.root!.left!.key).toBe(3);
		expect(tree.root!.left!.value).toBe(3);
		expect(tree.root!.left!.left!).toBeTruthy();
		expect(tree.root!.left!.left!.key).toBe(2);
		expect(tree.root!.left!.left!.value).toBe(2);
		expect(tree.root!.left!.right!).toBeTruthy();
		expect(tree.root!.left!.right!.key).toBe(4);
		expect(tree.root!.left!.right!.value).toBe(4);
		expect(tree.root!.right!).toBeTruthy();
		expect(tree.root!.right!.key).toBe(7);
		expect(tree.root!.right!.value).toBe(7);
		expect(tree.root!.right!.left!).toBeTruthy();
		expect(tree.root!.right!.left!.key).toBe(6);
		expect(tree.root!.right!.left!.value).toBe(6);
		expect(tree.root!.right!.right!).toBeTruthy();
		expect(tree.root!.right!.right!.key).toBe(8);
		expect(tree.root!.right!.right!.value).toBe(8);
	});

	it("should take the right child if the left does not exist", () => {
		const tree = new TestAvlTree();
		tree.insert(1, 1);
		tree.insert(2, 2);
		tree.delete(1);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(2);
		expect(tree.root!.value).toBe(2);
	});

	it("should take the left child if the right does not exist", () => {
		const tree = new TestAvlTree();
		tree.insert(2, 2);
		tree.insert(1, 1);
		tree.delete(2);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(1);
		expect(tree.root!.value).toBe(1);
	});

	it("should get the right child if the node has 2 leaf children", () => {
		const tree = new TestAvlTree();
		tree.insert(2, 2);
		tree.insert(1, 1);
		tree.insert(3, 3);
		tree.delete(2);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(3);
		expect(tree.root!.value).toBe(3);
	});

	it("should get the in-order successor if the node has both children", () => {
		const tree = new TestAvlTree();
		tree.insert(2, 2);
		tree.insert(1, 1);
		tree.insert(4, 4);
		tree.insert(3, 3);
		tree.insert(5, 5);
		tree.delete(2);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(3);
		expect(tree.root!.value).toBe(3);
	});
});

describe("avl tree insert", () => {
	it("should return the size of the tree", () => {
		const tree = new TestAvlTree();
		tree.insert(1);
		tree.insert(2);
		tree.insert(3);
		tree.insert(4);
		tree.insert(5);
		expect(tree.size).toBe(5);
	});

	it("should ignore insert of duplicate key", () => {
		const tree = new TestAvlTree();
		tree.insert(1);
		tree.insert(1);
		expect(tree.size).toBe(1);
	});

	/**
	 *         c
	 *        / \           _b_
	 *       b   z         /   \
	 *      / \     ->    a     c
	 *     a   y         / \   / \
	 *    / \           w   x y   z
	 *   w   x
	 */
	it("should correctly balance the left left case", () => {
		const tree = new TestAvlTree();
		tree.insert(3);
		tree.insert(2);
		tree.insert(1);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(2);
	});

	/**
	 *       c
	 *      / \           _b_
	 *     a   z         /   \
	 *    / \     ->    a     c
	 *   w   b         / \   / \
	 *      / \       w   x y   z
	 *     x   y
	 */
	it("should correctly balance the left right case", () => {
		const tree = new TestAvlTree();
		tree.insert(3);
		tree.insert(1);
		tree.insert(2);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(2);
	});

	/**
	 *     a
	 *    / \               _b_
	 *   w   b             /   \
	 *      / \     ->    a     c
	 *     x   c         / \   / \
	 *        / \       w   x y   z
	 *       y   z
	 */
	it("should correctly balance the right right case", () => {
		const tree = new TestAvlTree();
		tree.insert(1);
		tree.insert(2);
		tree.insert(3);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(2);
	});

	/**
	 *     a
	 *    / \             _b_
	 *   w   c           /   \
	 *      / \   ->    a     c
	 *     b   z       / \   / \
	 *    / \         w   x y   z
	 *   x   y
	 */
	it("should correctly balance the right left case", () => {
		const tree = new TestAvlTree();
		tree.insert(1);
		tree.insert(3);
		tree.insert(2);
		expect(tree.root!).toBeTruthy();
		expect(tree.root!.key).toBe(2);
	});
});
