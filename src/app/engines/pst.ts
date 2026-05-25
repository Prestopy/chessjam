// --- Piece Square Tables (PST) ---
// Index 0 = A1, Index 63 = H8
import {Piece} from "@/app/bitboardHelpers";
import {GameStage} from "@/app/utils";

// PSTs for white.
// WHITE SIDE UP
// BLACK SIDE DOWN

const MIDGAME_PAWN_PST = [
	[   0,   0,   0,   0,   0,   0,   0,   0],
	[   5,  10,  10, -20, -20,  10,  10,   5],
	[   5,  -5, -10,   0,   0, -10,  -5,   5],
	[   0,   0,   0,  20,  20,   0,   0,   0],
	[   5,  10,  15,  25,  25,  15,  10,   5],
	[  20,  20,  40,  50,  50,  40,  20,  20],
	[  75,  75,  75,  75,  75,  75,  75,  75],
	[   0,   0,   0,   0,   0,   0,   0,   0]
].flat();
const MIDGAME_BISHOP_PST = [
	[ -20, -10, -10, -10, -10, -10, -10, -20],
	[ -10,   5,   0,   0,   0,   0,   5, -10],
	[ -10,  10,  10,  10,  10,  10,  10, -10],
	[ -10,   5,  10,  10,  10,  10,   0, -10],
	[ -10,   5,   5,  10,  10,   5,   5, -10],
	[ -10,   0,   5,  10,  10,   5,   0, -10],
	[ -10,  -5,   0,   0,   0,   0,  -5, -10],
	[ -20, -10, -10, -10, -10, -10, -10, -20]
].flat();
const MIDGAME_ROOK_PST = [
	[   0,   0,   5,  10,  10,   5,   0,   0],
	[  -5,   0,   0,   0,   0,   0,   0,  -5],
	[  -5,   0,   0,   0,   0,   0,   0,  -5],
	[  -5,   0,   0,   0,   0,   0,   0,  -5],
	[  -5,   0,   0,   0,   0,   0,   0,  -5],
	[  -5,   0,   0,   0,   0,   0,   0,  -5],
	[  -5,  10,  10,  10,  10,  10,  10,  -5],
	[   0,   0,   0,   0,   0,   0,   0,   0]
].flat();
const MIDGAME_KNIGHT_PST = [
	[ -50, -40, -30, -30, -30, -30, -40, -50],
	[ -40, -20,   0,   0,   0,   0, -20, -40],
	[ -30,   0,  10,  15,  15,  10,   0, -30],
	[ -30,   5,  15,  20,  20,  15,   5, -30],
	[ -30,   0,  15,  20,  20,  15,   0, -30],
	[ -30,   5,  10,  15,  15,  10,   5, -30],
	[ -40, -20,   0,   5,   5,   0, -20, -40],
	[ -50, -40, -30, -30, -30, -30, -40, -50]
].flat();
const MIDGAME_QUEEN_PST = [
	[ -20, -10, -10,  -5,  -5, -10, -10, -20],
	[ -10,   0,   0,   0,   0,   0,   0, -10],
	[ -10,   0,   5,   5,   5,   5,   0, -10],
	[   0,   0,   5,   5,   5,   5,   0,   0],
	[  -5,   0,   5,   5,   5,   5,   0,  -5],
	[ -10,   0,   5,   5,   5,   5,   0, -10],
	[ -10,   0,   0,   0,   0,   0,   0, -10],
	[ -20, -10, -10,  -5,  -5, -10, -10, -20]
].flat();
const MIDGAME_KING_PST = [
	[  20,  30,  10,   0,   0,  10,  30,  20],
	[  20,  20,   0,   0,   0,   0,  20,  20],
	[ -10, -20, -20, -20, -20, -20, -20, -10],
	[ -20, -30, -30, -40, -40, -30, -30, -20],
	[ -30, -40, -40, -50, -50, -40, -40, -30],
	[ -30, -40, -40, -50, -50, -40, -40, -30],
	[ -30, -40, -40, -50, -50, -40, -40, -30],
	[ -30, -40, -40, -50, -50, -40, -40, -30]
].flat();

const ENDGAME_PAWN_PST = [
	[   0,   0,   0,   0,   0,   0,   0,   0],
	[   5,  10,  10,  20,  20,  10,  10,   5],
	[  10,  10,  20,  30,  30,  20,  10,  10],
	[  20,  20,  30,  40,  40,  30,  20,  20],
	[  30,  30,  40,  50,  50,  40,  30,  30],
	[  50,  50,  50,  50,  50,  50,  50,  50],
	[  80,  80,  80,  80,  80,  80,  80,  80],
	[   0,   0,   0,   0,   0,   0,   0,   0]
].flat();
const ENDGAME_BISHOP_PST = [
	[ -20, -10, -10, -10, -10, -10, -10, -20],
	[ -10,   0,   0,   0,   0,   0,   0, -10],
	[ -10,   0,   5,  10,  10,   5,   0, -10],
	[ -10,   5,   5,  10,  10,   5,   5, -10],
	[ -10,   5,  10,  10,  10,  10,   5, -10],
	[ -10,   0,  10,  10,  10,  10,   0, -10],
	[ -10,   0,   0,   0,   0,   0,   0, -10],
	[ -20, -10, -10, -10, -10, -10, -10, -20]
].flat();
const ENDGAME_ROOK_PST = [
	[  -5,  -5,  -5,  -5,  -5,  -5,  -5,  -5],
	[   0,   0,   0,   0,   0,   0,   0,   0],
	[   0,   0,   0,   0,   0,   0,   0,   0],
	[   0,   0,   0,   0,   0,   0,   0,   0],
	[   0,   0,   0,   0,   0,   0,   0,   0],
	[   0,   0,   0,   0,   0,   0,   0,   0],
	[  20,  20,  20,  20,  20,  20,  20,  20],
	[   0,   0,   0,   0,   0,   0,   0,   0]
].flat();
const ENDGAME_KNIGHT_PST = [
	[ -50, -40, -30, -30, -30, -30, -40, -50],
	[ -30, -10,   0,   0,   0,   0, -10, -30],
	[ -30,   0,  10,  15,  15,  10,   0, -30],
	[ -30,   5,  15,  20,  20,  15,   5, -30],
	[ -30,   0,  15,  20,  20,  15,   0, -30],
	[ -30,   5,  10,  10,  10,  10,   5, -30],
	[ -40, -20,   0,   5,   5,   0, -20, -40],
	[ -50, -40, -30, -30, -30, -30, -40, -50]
].flat();
const ENDGAME_QUEEN_PST = [
	[ -20, -10, -10,  -5,  -5, -10, -10, -20],
	[ -10,   0,   0,   0,   0,   0,   0, -10],
	[ -10,   0,  10,  10,  10,  10,   0, -10],
	[  -5,   0,  10,  20,  20,  10,   0,  -5],
	[  -5,   0,  10,  20,  20,  10,   0,  -5],
	[ -10,   0,  10,  10,  10,  10,   0, -10],
	[ -10,   0,   0,   0,   0,   0,   0, -10],
	[ -20, -10, -10,  -5,  -5, -10, -10, -20]
].flat();
const ENDGAME_KING_PST = [
	[ -50, -40, -30, -20, -20, -30, -40, -50],
	[ -30, -20, -10,   0,   0, -10, -20, -30],
	[ -30, -10,  20,  30,  30,  20, -10, -30],
	[ -30, -10,  30,  40,  40,  30, -10, -30],
	[ -30, -10,  30,  40,  40,  30, -10, -30],
	[ -30, -10,  20,  30,  30,  20, -10, -30],
	[ -30, -30,   0,   0,   0,   0, -30, -30],
	[ -50, -40, -30, -30, -30, -30, -40, -50]
].flat();

export const PST = {
	[GameStage.Midgame]: {
		[Piece.WhitePawn]:   MIDGAME_PAWN_PST,
		[Piece.WhiteKnight]: MIDGAME_KNIGHT_PST,
		[Piece.WhiteBishop]: MIDGAME_BISHOP_PST,
		[Piece.WhiteRook]:   MIDGAME_ROOK_PST,
		[Piece.WhiteQueen]:  MIDGAME_QUEEN_PST,
		[Piece.WhiteKing]:   MIDGAME_KING_PST,

		// FIX: Clone the array first using [...spread], THEN reverse it safely!
		[Piece.BlackPawn]:   [...MIDGAME_PAWN_PST].reverse(),
		[Piece.BlackKnight]: [...MIDGAME_KNIGHT_PST].reverse(),
		[Piece.BlackBishop]: [...MIDGAME_BISHOP_PST].reverse(),
		[Piece.BlackRook]:   [...MIDGAME_ROOK_PST].reverse(),
		[Piece.BlackQueen]:  [...MIDGAME_QUEEN_PST].reverse(),
		[Piece.BlackKing]:   [...MIDGAME_KING_PST].reverse(),
	},
	[GameStage.Endgame]: {
		[Piece.WhitePawn]:   ENDGAME_PAWN_PST,
		[Piece.WhiteKnight]: ENDGAME_KNIGHT_PST,
		[Piece.WhiteBishop]: ENDGAME_BISHOP_PST,
		[Piece.WhiteRook]:   ENDGAME_ROOK_PST,
		[Piece.WhiteQueen]:  ENDGAME_QUEEN_PST,
		[Piece.WhiteKing]:   ENDGAME_KING_PST,

		// FIX: Clone the array first here as well
		[Piece.BlackPawn]:   [...ENDGAME_PAWN_PST].reverse(),
		[Piece.BlackKnight]: [...ENDGAME_KNIGHT_PST].reverse(),
		[Piece.BlackBishop]: [...ENDGAME_BISHOP_PST].reverse(),
		[Piece.BlackRook]:   [...ENDGAME_ROOK_PST].reverse(),
		[Piece.BlackQueen]:  [...ENDGAME_QUEEN_PST].reverse(),
		[Piece.BlackKing]:   [...ENDGAME_KING_PST].reverse(),
	}
}
