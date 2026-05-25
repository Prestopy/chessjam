import {Color, makePiece, Move, MoveFlag, Piece, PieceName} from "@/app/bitboardHelpers";

// bits 0-5:   from square (0-63)
// bits 6-11:  to square (0-63)
// bits 12-16: flags (5 bits)
// bits 17-20: captured piece (0-11, 15 = none)
// bits 21-24: promotion piece (0-11, 15 = none)

const NO_PIECE = 15;

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

// --- Decoders ---
export function moveFromSq(m: Move):   number { return  m        & 0x3f; }
export function moveToSq(m: Move):     number { return (m >> 6)  & 0x3f; }
export function moveFlags(m: Move):    number { return (m >> 12) & 0x1f;  }

export function moveFromRow(m: Move):  number { return moveFromSq(m) >> 3; }
export function moveFromCol(m: Move):  number { return moveFromSq(m) & 7;  }
export function moveToRow(m: Move):    number { return moveToSq(m)   >> 3; }
export function moveToCol(m: Move):    number { return moveToSq(m)   & 7;  }

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

// --- Builders (mirrors old markAs* methods) ---
export function makeCaptureMove(fromSq: number, toSq: number, captured: Piece): Move {
	return makeMove(fromSq, toSq, MoveFlag.Capture, captured);
}
export function makeEnPassantMove(fromSq: number, toSq: number, capturedColor: Color): Move {
	return makeMove(fromSq, toSq, MoveFlag.EnPassant | MoveFlag.Capture, makePiece(PieceName.Pawn, capturedColor));
}
export function makePromotionMove(fromSq: number, toSq: number, promotion: Piece, captured: Piece | null = null): Move {
	const flags = MoveFlag.Promotion | (captured !== null ? MoveFlag.Capture : MoveFlag.None);
	return makeMove(fromSq, toSq, flags, captured, promotion);
}
export function makeCastleMove(fromSq: number, toSq: number): Move {
	return makeMove(fromSq, toSq, MoveFlag.Castle);
}

// --- Setters ---
export function setPromotionPiece(m: Move, promotion: Piece): Move {
	const clearedMove = m & ~(0xf << 21);
	return clearedMove | (promotion << 21) | (MoveFlag.Promotion << 12);
}
