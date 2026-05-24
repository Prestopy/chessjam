import { Chess } from "@/app/Chess";
import { Engine } from "@/app/engines/Engine";
import { swapColor } from "@/app/utils";
import { Color, Piece, PieceName } from "@/app/bitboardHelpers";
import Engine_v5 from "@/app/engines/Engine_v5";

// --- Piece Square Tables (PST) ---
// Index 0 = A1, Index 63 = H8
const PAWN_PST = [
	[75, 75, 75, 75, 75, 75, 75, 75],
	[50, 50, 50, 50, 50, 50, 50, 50],
	[10, 10, 20, 30, 30, 20, 10, 10],
	[5,   5, 10, 25, 25, 10,  5,  5],
	[0,   0,  0, 20, 20,  0,  0,  0],
	[5,  -5,-10,  0,  0,-10, -5,  5],
	[5,  10, 10,-20,-20, 10, 10,  5],
	[0,   0,  0,  0,  0,  0,  0,  0]
].reverse().flat();

const BISHOP_PST = [
	[-20,-10,-10,-10,-10,-10,-10,-20],
	[-10,  0,  0,  0,  0,  0,  0,-10],
	[-10,  0,  5, 10, 10,  5,  0,-10],
	[-10,  5,  5, 10, 10,  5,  5,-10],
	[-10,  0, 10, 10, 10, 10,  0,-10],
	[-10, 10, 10, 10, 10, 10, 10,-10],
	[-10,  5,  0,  0,  0,  0, -5,-10],
	[-20,-10,-40,-50,-50,-40,-10,-20]
].reverse().flat();

const ROOK_PST = [
	[0,   0,  0,  0,  0,  0,  0, 0],
	[5,  10, 10, 10, 10, 10, 10, 5],
	[-5,  0,  0,  0,  0,  0,  0,-5],
	[-5,  0,  0,  0,  0,  0,  0,-5],
	[-5,  0,  0,  0,  0,  0,  0,-5],
	[-5,  0,  0,  0,  0,  0,  0,-5],
	[-5,-10,-10,-10,-10,-10,-10,-5],
	[0,  0,   0,  5,  5,  0,  0, 0]
].reverse().flat();

const KNIGHT_PST = [
	[-50,-40,-30,-30,-30,-30,-40,-50],
	[-40,-20,  0,  5,  5,  0,-20,-40],
	[-30,  5, 10, 15, 15, 10,  5,-30],
	[-30,  0, 15, 20, 20, 15,  0,-30],
	[-30,  5, 15, 20, 20, 15,  5,-30],
	[-30,  0, 10, 15, 15, 10,  0,-30],
	[-40,-20,  0,  0,  0,  0,-20,-40],
	[-50,-40,-30,-30,-30,-30,-40,-50]
].reverse().flat(); // Fixed: Added reverse to match coordinate orientation

const QUEEN_PST = [
	[-20,-10,-10, -5, -5,-10,-10,-20],
	[-10,  0,  0,  0,  0,  0,  0,-10],
	[-10,  0,  5,  5,  5,  5,  0,-10],
	[ -5,  0,  5,  5,  5,  5,  0, -5],
	[  0,  0,  5,  5,  5,  5,  0,  0],
	[-10,  5,  5,  5,  5,  5,  0,-10],
	[-10,  0,  5,  0,  0,  0,  0,-10],
	[-20,-10,-10, -5, -5,-10,-10,-20]
].reverse().flat();

const KING_PST = [
	[-30,-40,-40,-50,-50,-40,-40,-30],
	[-30,-40,-40,-50,-50,-40,-40,-30],
	[-30,-40,-40,-50,-50,-40,-40,-30],
	[-30,-40,-40,-50,-50,-40,-40,-30],
	[-20,-30,-30,-40,-40,-30,-30,-20],
	[-10,-20,-20,-20,-20,-20,-20,-10],
	[ 20, 20,  0,  0,  0,  0, 20, 20],
	[ 20, 30, 10,  0,  0, 10, 30, 20]
].reverse().flat();

// Utility Bitscan helper for your loops
function getSquareIndices(bitboard: bigint): number[] {
	const indices: number[] = [];
	let mask = bitboard;
	let index = 0;
	while (mask > 0n) {
		if (mask & 1n) {
			indices.push(index);
		}
		mask >>= 1n;
		index++;
	}
	return indices;
}

export default class Engine_v6 extends Engine_v5 {
	evaluate(position: Chess, currentTurnColor: Color): number {
		// Absolute base material count (White minus Black points)
		const materialScore = position.countPoints(Color.White) - position.countPoints(Color.Black);

		// Positional PST metrics (White minus Black values)
		const positionalScore = this.evaluatePST(position);

		const totalScore = materialScore + positionalScore;

		// In Negamax, return the score from the moving side's view
		return currentTurnColor === Color.White ? totalScore : -totalScore;
	}

	// Static PST evaluation (Always returns score from White's perspective)
	evaluatePST(position: Chess): number {
		let score = 0;
		const board = position.getBoard();

		// --- 1. PAWNS ---
		const whitePawns = getSquareIndices(board[Piece.WhitePawn]);
		for (const sq of whitePawns) score += PAWN_PST[sq];

		const blackPawns = getSquareIndices(board[Piece.BlackPawn]);
		for (const sq of blackPawns) score -= PAWN_PST[sq ^ 56];

		// --- 2. BISHOPS ---
		const whiteBishops = getSquareIndices(board[Piece.WhiteBishop]);
		for (const sq of whiteBishops) score += BISHOP_PST[sq];

		const blackBishops = getSquareIndices(board[Piece.BlackBishop]);
		for (const sq of blackBishops) score -= BISHOP_PST[sq ^ 56];

		// --- 3. KNIGHTS ---
		const whiteKnights = getSquareIndices(board[Piece.WhiteKnight]);
		for (const sq of whiteKnights) score += KNIGHT_PST[sq];

		const blackKnights = getSquareIndices(board[Piece.BlackKnight]);
		for (const sq of blackKnights) score -= KNIGHT_PST[sq ^ 56];

		// --- 4. ROOKS ---
		const whiteRooks = getSquareIndices(board[Piece.WhiteRook]);
		for (const sq of whiteRooks) score += ROOK_PST[sq];

		const blackRooks = getSquareIndices(board[Piece.BlackRook]);
		for (const sq of blackRooks) score -= ROOK_PST[sq ^ 56];

		// --- 5. QUEENS ---
		const whiteQueens = getSquareIndices(board[Piece.WhiteQueen]);
		for (const sq of whiteQueens) score += QUEEN_PST[sq];

		const blackQueens = getSquareIndices(board[Piece.BlackQueen]);
		for (const sq of blackQueens) score -= QUEEN_PST[sq ^ 56];

		// --- 6. KINGS ---
		const whiteKings = getSquareIndices(board[Piece.WhiteKing]);
		for (const sq of whiteKings) score += KING_PST[sq];

		const blackKings = getSquareIndices(board[Piece.BlackKing]);
		for (const sq of blackKings) score -= KING_PST[sq ^ 56];

		return score;
	}
}
