import {Board, Color, Piece} from "@/app/utils/types";
import {not64, u64} from "@/app/utils/bitUtils";


// ##### Masks #####
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

/**
 * Returns a bigint with a single bit set corresponding to the square at (row, col).
 * @param sq
 */
export function squareMask(sq: number): bigint {
	return u64(1n << BigInt(sq));
}


// ##### Occupancy #####
export function whiteOccupancy(board: Board): bigint {
	return u64(board[Piece.WhitePawn]   | board[Piece.WhiteKnight] |
		   board[Piece.WhiteBishop]     | board[Piece.WhiteRook]   |
		   board[Piece.WhiteQueen]      | board[Piece.WhiteKing]);
}

export function blackOccupancy(board: Board): bigint {
	return u64(board[Piece.BlackPawn]   | board[Piece.BlackKnight] |
		   board[Piece.BlackBishop] | board[Piece.BlackRook]   |
		   board[Piece.BlackQueen]  | board[Piece.BlackKing]);
}

export function allOccupancy(board: Board): bigint {
	return whiteOccupancy(board) | blackOccupancy(board);
}

export function colorOccupancy(board: Board, color: Color): bigint {
	return color === Color.White ? whiteOccupancy(board) : blackOccupancy(board);
}

export function enemyOccupancy(board: Board, color: Color): bigint {
	return color === Color.White ? blackOccupancy(board) : whiteOccupancy(board);
}
