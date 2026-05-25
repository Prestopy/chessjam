/**
 * Utility function for bit manipulation on bigints treated as unsigned 64-bit integers.
 * @param n
 */
export function u64(n: bigint): bigint {
	return BigInt.asUintN(64, n);
}

/**
 * Utility function to compute the bitwise NOT of a bigint treated as an unsigned 64-bit integer.
 * @param n
 */
export function not64(n: bigint): bigint {
	return u64(~n);
}

const DEBRUIJN64 = 0x03f79d71b4ca8b09n;
const DEBRUIJN_TABLE: number[] = (() => {
	const table = new Array(64).fill(0);
	for (let i = 0; i < 64; i++) {
		const idx = Number((DEBRUIJN64 << BigInt(i)) >> 58n & 63n);
		table[idx] = i;
	}
	return table;
})();

/**
 * Finds the index of the least significant set bit (LSB) in a bigint treated as an unsigned 64-bit integer.
 * @param bb
 */
export function lsb(bb: bigint): number {
	const n = bb < 0n ? bb + (1n << 64n) : bb; // reinterpret as unsigned
	const isolated = n & -n;                    // isolate lowest set bit
	const idx = Number((isolated * DEBRUIJN64) >> 58n & 63n);
	return DEBRUIJN_TABLE[idx];
}

/**
 * Counts the number of set bits (1s) in a bigint treated as an unsigned 64-bit integer.
 * @param bb
 */
export function popcount(bb: bigint): number {
	let n = u64(bb < 0n ? bb + (1n << 64n) : bb);
	let count = 0;
	while (n) {
		n &= n - 1n;
		count++;
	}
	return count;
}

/**
 * Reverses the bits of a bigint treated as an unsigned 64-bit integer.
 * @param bb
 */
export function reverseBits(n: bigint): bigint {
	let result = 0n;
	let temp = u64(n);
	for (let i = 0; i < 64; i++) {
		result = u64(result << 1n) | (temp & 1n);
		temp >>= 1n;
	}
	return u64(result);
}
