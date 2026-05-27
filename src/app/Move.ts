import {Board, Move, MoveFlag, Piece} from "@/app/utils/types";
import {getBoardSquare, lsb} from "@/app/utils/bitUtils";

// bits 0-5:   from square (0-63)
// bits 6-11:  to square (0-63)
// bits 12-16: flags (5 bits)
// bits 17-20: captured piece (0-11, 15 = none)
// bits 21-24: promotion piece (0-11, 15 = none)

export const NO_PIECE = 15 as const;

/**
 * Helper function to create a move integer from its components.
 * @param fromSq
 * @param toSq
 * @param flags
 * @param captured
 * @param promotion
 */
export function makeMove(
	fromSq: number,
	toSq: number,
	flags: number = MoveFlag.None,
	captured: Piece | null = null,
	promotion: Piece | null = null,
): Move {
	return (
		fromSq                              |
		(toSq                    << 6)      |
		(flags                   << 12)     |
		((captured  ?? NO_PIECE) << 17)     |
		((promotion ?? NO_PIECE) << 21)
	);
}

/**
 * Helper function to add moves from a bitboard of target squares.
 * For each set bit in bb, adds a move from (fromRow, fromCol) to the corresponding square.
 * @param result
 * @param fromSq
 * @param bb
 */
export function addMoves(result: Move[], fromSq: number, bb: bigint) {
	while(bb > 0n) {
		const toSq = lsb(bb);
		bb &= bb - 1n; // clear LSB

		result.push(makeMove(fromSq, toSq))
	}
}

/**
 * Helper function to add moves from a bitboard of target squares.
 * For each set bit in bb, adds a move from (fromRow, fromCol) to the corresponding square.
 * Additionally, sets the provided flags on each move (e.g. capture, promotion).
 * @param result
 * @param fromSq
 * @param bb
 * @param flags
 */
export function addMovesWithFlags(result: Move[], fromSq: number, bb: bigint, flags: MoveFlag) {
	while(bb > 0n) {
		const toSq = lsb(bb);
		bb &= bb - 1n; // clear LSB

		result.push(makeMove(fromSq, toSq, flags))
	}
}

/**
 * Helper function to add capture moves from a bitboard of target squares.
 * @param result
 * @param fromSq
 * @param bb
 * @param board
 */
export function addCaptureMoves(result: Move[], fromSq: number, bb: bigint, board: Board) {
	while(bb > 0n) {
		const toSq = lsb(bb);
		bb &= bb - 1n; // clear LSB

		const piece = getBoardSquare(board, toSq);
		if (piece === null) throw new Error('Invalid capture move; no piece found on square indicated by bitboard');

		result.push(makeMove(fromSq, toSq, MoveFlag.Capture, piece))
	}
}

// --- Decoders ---
export function moveFromSq(m: Move):   number { return  m        & 0x3f; }
export function moveToSq(m: Move):     number { return (m >> 6)  & 0x3f; }
export function moveFlags(m: Move):    number { return (m >> 12) & 0x1f;  }

export function moveFromRow(m: Move):  number { return moveFromSq(m) >> 3; }
export function moveFromCol(m: Move):  number { return moveFromSq(m) & 7;  }
export function moveToRow(m: Move):    number { return moveToSq(m)   >> 3; }
export function moveToCol(m: Move):    number { return moveToSq(m)   & 7;  }

/**
 * Helper function to extract all components of a move into an object.
 * @param move
 */
export function disectMove(move: Move): { fromRow: number; fromCol: number; toRow: number; toCol: number } {
	return {
		fromRow: moveFromRow(move),
		fromCol: moveFromCol(move),
		toRow:   moveToRow(move),
		toCol:   moveToCol(move),
	};
}

export function moveCaptured(m: Move): Piece | null {
	const p = (m >> 17) & 0xf;
	return p === NO_PIECE ? null : p as Piece;
}
export function movePromotion(m: Move): Piece | null {
	const p = (m >> 21) & 0xf;
	return p === NO_PIECE ? null : p as Piece;
}

// --- Flag checks ---
export function isCaptureMove(m: Move):    boolean { return (moveFlags(m) & MoveFlag.Capture)    !== 0; }
export function isPromotionMove(m: Move):  boolean { return (moveFlags(m) & MoveFlag.Promotion)  !== 0; }
export function isEnPassantMove(m: Move):  boolean { return (moveFlags(m) & MoveFlag.EnPassant)  !== 0; }
export function isCastleMove(m: Move):     boolean { return (moveFlags(m) & MoveFlag.Castle)     !== 0; }
export function isDoublePushMove(m: Move): boolean { return (moveFlags(m) & MoveFlag.DoublePush) !== 0; }

// --- Setters ---                                                       | 15: NO_PIECE
export function setPromotionPiece(m: Move, promotion: Piece | 15): Move {
	const clearedMove = m & ~(0xf << 21);
	return clearedMove | (promotion << 21) | (MoveFlag.Promotion << 12);
}
