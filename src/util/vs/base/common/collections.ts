//!!! DO NOT modify, this file was COPIED from 'microsoft/vscode'

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * An interface for a JavaScript object that
 * acts a dictionary. The keys are strings.
 */
export type IStringDictionary<V> = Record<string, V>;

/**
 * An interface for a JavaScript object that
 * acts a dictionary. The keys are numbers.
 */
export type INumberDictionary<V> = Record<number, V>;

/**
 * Groups the collection into a dictionary based on the provided
 * group function.
 */
export function groupBy<K extends string | number | symbol, V>(data: V[], groupFn: (element: V) => K): Record<K, V[]> {
	const result: Record<K, V[]> = Object.create(null);
	for (const element of data) {
		const key = groupFn(element);
		let target = result[key];
		if (!target) {
			target = result[key] = [];
		}
		target.push(element);
	}
	return result;
}

export function diffSets<T>(before: ReadonlySet<T>, after: ReadonlySet<T>): { removed: T[]; added: T[] } {
	const removed: T[] = [];
	const added: T[] = [];
	for (const element of before) {
		if (!after.has(element)) {
			removed.push(element);
		}
	}
	for (const element of after) {
		if (!before.has(element)) {
			added.push(element);
		}
	}
	return { removed, added };
}

export function diffMaps<K, V>(before: Map<K, V>, after: Map<K, V>): { removed: V[]; added: V[] } {
	const removed: V[] = [];
	const added: V[] = [];
	for (const [index, value] of before) {
		if (!after.has(index)) {
			removed.push(value);
		}
	}
	for (const [index, value] of after) {
		if (!before.has(index)) {
			added.push(value);
		}
	}
	return { removed, added };
}

/**
 * Computes the intersection of two sets.
 *
 * @param setA - The first set.
 * @param setB - The second iterable.
 * @returns A new set containing the elements that are in both `setA` and `setB`.
 */
export function intersection<T>(setA: Set<T>, setB: Iterable<T>): Set<T> {
	const result = new Set<T>();
	for (const elem of setB) {
		if (setA.has(elem)) {
			result.add(elem);
		}
	}
	return result;
}

export class SetWithKey<T> implements Set<T> {
	private _map = new Map<any, T>();

	constructor(values: T[], private toKey: (t: T) => unknown) {
		for (const value of values) {
			this.add(value);
		}
	}

	get size(): number {
		return this._map.size;
	}

	add(value: T): this {
		const key = this.toKey(value);
		this._map.set(key, value);
		return this;
	}

	delete(value: T): boolean {
		return this._map.delete(this.toKey(value));
	}

	has(value: T): boolean {
		return this._map.has(this.toKey(value));
	}

	entries(): SetIterator<[T, T]> {
		const map = this._map.values();
		const iterator = map[Symbol.iterator]();
		
		const result: SetIterator<[T, T]> = {
			[Symbol.iterator]() {
				return result;
			},
			next(): IteratorResult<[T, T]> {
				const next = iterator.next();
				if (next.done) {
					return { value: undefined, done: true };
				}
				const entry = next.value;
				return { value: [entry, entry], done: false };
			},
			[Symbol.dispose]() {
				// 添加dispose方法以满足SetIterator接口要求
			}
		};
		return result;
	}

	keys(): SetIterator<T> {
		const map = this._map.values();
		const iterator = map[Symbol.iterator]();
		
		const result: SetIterator<T> = {
			[Symbol.iterator]() {
				return result;
			},
			next(): IteratorResult<T> {
				const next = iterator.next();
				if (next.done) {
					return { value: undefined, done: true };
				}
				return { value: next.value, done: false };
			},
			[Symbol.dispose]() {
				// 添加dispose方法以满足SetIterator接口要求
			}
		};
		return result;
	}

	values(): SetIterator<T> {
		const map = this._map.values();
		const iterator = map[Symbol.iterator]();
		
		const result: SetIterator<T> = {
			[Symbol.iterator]() {
				return result;
			},
			next(): IteratorResult<T> {
				const next = iterator.next();
				if (next.done) {
					return { value: undefined, done: true };
				}
				return { value: next.value, done: false };
			},
			[Symbol.dispose]() {
				// 添加dispose方法以满足SetIterator接口要求
			}
		};
		return result;
	}

	clear(): void {
		this._map.clear();
	}

	forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
		this._map.forEach(entry => callbackfn.call(thisArg, entry, entry, this));
	}

	[Symbol.iterator](): SetIterator<T> {
		const map = this._map.values();
		const iterator = map[Symbol.iterator]();
		
		const result: SetIterator<T> = {
			[Symbol.iterator]() {
				return result;
			},
			next(): IteratorResult<T> {
				const next = iterator.next();
				if (next.done) {
					return { value: undefined, done: true };
				}
				return { value: next.value, done: false };
			},
			[Symbol.dispose]() {
				// 添加dispose方法以满足SetIterator接口要求
			}
		};
		return result;
	}

	[Symbol.toStringTag]: string = 'SetWithKey';
}
