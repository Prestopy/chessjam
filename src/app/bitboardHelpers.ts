export type Board = BigInt64Array & { length: 12 };

/**
 * Masks
 */
export const RANK: readonly bigint[] = [
	0x00000000000000ffn, // row 0 White's home rank
	0x000000000000ff00n, // row 1
	0x0000000000ff0000n, // row 2
	0x00000000ff000000n, // row 3
	0x000000ff00000000n, // row 4
	0x0000ff0000000000n, // row 5
	0x00ff000000000000n, // row 6
	0xff00000000000000n, // row 7 Black's home rank
];

export const FILE: readonly bigint[] = [
	0x0101010101010101n, // file A (col 0)
	0x0202020202020202n, // file B (col 1)
	0x0404040404040404n, // file C (col 2)
	0x0808080808080808n, // file D (col 3)
	0x1010101010101010n, // file E (col 4)
	0x2020202020202020n, // file F (col 5)
	0x4040404040404040n, // file G (col 6)
	0x8080808080808080n, // file H (col 7)
];

export const RANK_1 = RANK[0];
export const RANK_2 = RANK[1];
export const RANK_3 = RANK[2];
export const RANK_4 = RANK[3];
export const RANK_5 = RANK[4];
export const RANK_6 = RANK[5];
export const RANK_7 = RANK[6];
export const RANK_8 = RANK[7];

export const FILE_A = FILE[0];
export const FILE_B = FILE[1];
export const FILE_C = FILE[2];
export const FILE_D = FILE[3];
export const FILE_E = FILE[4];
export const FILE_F = FILE[5];
export const FILE_G = FILE[6];
export const FILE_H = FILE[7];

export const NOT_A_FILE = not64(FILE_A);
export const NOT_H_FILE = not64(FILE_H);
export const NOT_AB_FILE = not64(FILE_A | FILE_B);
export const NOT_GH_FILE = not64(FILE_G | FILE_H);

export const MAIN_DIAG      = 0x8040201008040201n // a1-h8 diagonal
export const MAIN_ANTI_DIAG = 0x0102040810204080n // a8-h1 anti-diagonal
export const DIAG      = Array.from({ length: 64 }, (_, sq) => diagMask(sq));
export const ANTI_DIAG = Array.from({ length: 64 }, (_, sq) => antiDiagMask(sq));

function diagMask(sq: number): bigint {
	let mask = 0n;
	const startRow = sq >> 3;
	const startCol = sq & 7;

	// 1. Trace Up-Right (Row increases, Col increases)
	for (let r = startRow, c = startCol; r < 8 && c < 8; r++, c++) {
		mask |= squareMask(r * 8 + c);
	}
	// 2. Trace Down-Left (Row decreases, Col decreases)
	for (let r = startRow, c = startCol; r >= 0 && c >= 0; r--, c--) {
		mask |= squareMask(r * 8 + c);
	}

	return u64(mask);
}

function antiDiagMask(sq: number): bigint {
	let mask = 0n;
	const startRow = sq >> 3;
	const startCol = sq & 7;

	// 1. Trace Up-Left (Row increases, Col decreases)
	for (let r = startRow, c = startCol; r < 8 && c >= 0; r++, c--) {
		mask |= squareMask(r * 8 + c);
	}
	// 2. Trace Down-Right (Row decreases, Col increases)
	for (let r = startRow, c = startCol; r >= 0 && c < 8; r--, c++) {
		mask |= squareMask(r * 8 + c);
	}

	return u64(mask);
}

// FLAGS

export const enum MoveFlag {
	None           = 0,
	Capture        = 1 << 0,
	Promotion      = 1 << 1,
	EnPassant      = 1 << 2,  // implies Capture
	Castle         = 1 << 3,
	DoublePush     = 1 << 4,  // needed for en passant detection on next move
}

export type Move = number;

export const enum Color {
	White = 0,
	Black = 1,
}

export const enum PieceName {
	Pawn   = 0,
	Knight = 1,
	Bishop = 2,
	Rook   = 3,
	Queen  = 4,
	King   = 5,
}

export const enum Piece {
	WhitePawn   = 0,
	WhiteKnight = 1,
	WhiteBishop = 2,
	WhiteRook   = 3,
	WhiteQueen  = 4,
	WhiteKing   = 5,
	BlackPawn   = 6,
	BlackKnight = 7,
	BlackBishop = 8,
	BlackRook   = 9,
	BlackQueen  = 10,
	BlackKing   = 11,
}

// All squares occupied by white
export function whiteOccupancy(board: Board): bigint {
	return u64(board[Piece.WhitePawn]   | board[Piece.WhiteKnight] |
		   board[Piece.WhiteBishop] | board[Piece.WhiteRook]   |
		   board[Piece.WhiteQueen]  | board[Piece.WhiteKing]);
}

// All squares occupied by black
export function blackOccupancy(board: Board): bigint {
	return u64(board[Piece.BlackPawn]   | board[Piece.BlackKnight] |
		   board[Piece.BlackBishop] | board[Piece.BlackRook]   |
		   board[Piece.BlackQueen]  | board[Piece.BlackKing]);
}

// All occupied squares (the "blocker" board)
export function allOccupancy(board: Board): bigint {
	return whiteOccupancy(board) | blackOccupancy(board);
}

export function colorOccupancy(board: Board, color: Color): bigint {
	return color === Color.White ? whiteOccupancy(board) : blackOccupancy(board);
}

export function enemyOccupancy(board: Board, color: Color): bigint {
	return color === Color.White ? blackOccupancy(board) : whiteOccupancy(board);
}

export function makePiece(pieceName: PieceName, color: Color): Piece {
	return pieceName + color * 6;
}

export function pieceColor(p: Piece): Color {
	return (p >= 6 ? Color.Black : Color.White);
}

export function pieceName(p: Piece): PieceName {
	return (p % 6) as PieceName;
}

// BIT STUFF
export function u64(n: bigint): bigint {
	return BigInt.asUintN(64, n);
}
export function not64(n: bigint): bigint {
	return u64(~n);
}

export function getSquareIndices(bitboard: bigint): number[] {
	const indices: number[] = [];
	let mask = bitboard;
	let index = 0;

	while (mask > 0n) {
		// If the lowest bit is a 1, grab its index
		if (mask & 1n) {
			indices.push(index);
		}
		mask >>= 1n;
		index++;
	}
	return indices;
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

/**
 * Rotates the bits of a bigint representing a chess bitboard 90 degrees clockwise.
 * @param bb
 */
export function rotateBits90Clockwise(bb: bigint): bigint {
	// Transpose
	let n = 0n;
	for (let i = 0; i < 8; i++) {
		n |= ((bb >> BigInt(i)) & 0x0101010101010101n) << BigInt(i * 8);
	}
	// Reverse rows
	n = ((n & 0x00ff00ff00ff00ffn) << 8n) | ((n >> 8n) & 0x00ff00ff00ff00ffn);
	n = ((n & 0x0000ffff0000ffffn) << 16n) | ((n >> 16n) & 0x0000ffff0000ffffn);
	n = (n << 32n) | (n >> 32n);
	return n;
}

/**
 * Rotates the bits of a bigint representing a chess bitboard 90 degrees counterclockwise.
 * @param bb
 */
export function rotateBits90Counter(bb: bigint): bigint {
	// Transpose
	let n = 0n;
	for (let i = 0; i < 8; i++) {
		n |= ((bb >> BigInt(i)) & 0x0101010101010101n) << BigInt((7 - i) * 8);
	}
	// Reverse columns
	n = ((n & 0x5555555555555555n) << 1n) | ((n >> 1n) & 0x5555555555555555n);
	n = ((n & 0x3333333333333333n) << 2n) | ((n >> 2n) & 0x3333333333333333n);
	n = ((n & 0x0f0f0f0f0f0f0f0fn) << 4n) | ((n >> 4n) & 0x0f0f0f0f0f0f0f0fn);
	return n;
}

/**
 * Converts (row, col) to a square index from 0 to 63, where 0 is a1 and 63 is h8.
 * @param row
 * @param col
 */
export function squareIndex(row: number, col: number): number {
	return row * 8 + col;
}

/**
 * Returns a bigint with a single bit set corresponding to the square at (row, col).
 * @param sq
 */
export function squareMask(sq: number): bigint {
	return u64(1n << BigInt(sq));
}

/**
 * Creates an empty board represented as a BigInt64Array of length 12, where each element corresponds to a piece type and color.
 */
export function makeEmptyBoard(): Board {
	return new BigInt64Array(12) as Board;
}


/**
 * Counts the number of set bits (1s) in a bigint treated as an unsigned 64-bit integer.
 * @param bb
 */
export function popcount(bb: bigint): number {
	let n = u64(bb < 0n ? bb + (1n << 64n) : bb);
	let count = 0;
	while (n) { n &= n - 1n; count++; }
	return count;
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
