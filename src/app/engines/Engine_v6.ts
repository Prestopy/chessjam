import { Chess } from "@/app/Chess";
import { Engine } from "@/app/engines/Engine";
import { swapColor } from "@/app/utils";
import { Color, Piece, PieceName } from "@/app/bitboardHelpers";
import Engine_v5 from "@/app/engines/Engine_v5";
import {PST} from "@/app/engines/pst";

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
		for (const sq of whitePawns) score += PST.midgame[Piece.WhitePawn][sq];

		const blackPawns = getSquareIndices(board[Piece.BlackPawn]);
		for (const sq of blackPawns) score -= PST.midgame[Piece.BlackPawn][sq];

		// --- 2. BISHOPS ---
		const whiteBishops = getSquareIndices(board[Piece.WhiteBishop]);
		for (const sq of whiteBishops) score += PST.midgame[Piece.WhiteBishop][sq];

		const blackBishops = getSquareIndices(board[Piece.BlackBishop]);
		for (const sq of blackBishops) score -= PST.midgame[Piece.BlackBishop][sq];

		// --- 3. KNIGHTS ---
		const whiteKnights = getSquareIndices(board[Piece.WhiteKnight]);
		for (const sq of whiteKnights) score += PST.midgame[Piece.WhiteKnight][sq];

		const blackKnights = getSquareIndices(board[Piece.BlackKnight]);
		for (const sq of blackKnights) score -= PST.midgame[Piece.BlackKnight][sq];

		// --- 4. ROOKS ---
		const whiteRooks = getSquareIndices(board[Piece.WhiteRook]);
		for (const sq of whiteRooks) score += PST.midgame[Piece.WhiteRook][sq];

		const blackRooks = getSquareIndices(board[Piece.BlackRook]);
		for (const sq of blackRooks) score -= PST.midgame[Piece.BlackRook][sq];

		// --- 5. QUEENS ---
		const whiteQueens = getSquareIndices(board[Piece.WhiteQueen]);
		for (const sq of whiteQueens) score += PST.midgame[Piece.WhiteQueen][sq];

		const blackQueens = getSquareIndices(board[Piece.BlackQueen]);
		for (const sq of blackQueens) score -= PST.midgame[Piece.BlackQueen][sq];

		// --- 6. KINGS ---
		const whiteKings = getSquareIndices(board[Piece.WhiteKing]);
		for (const sq of whiteKings) score += PST.midgame[Piece.WhiteKing][sq];

		const blackKings = getSquareIndices(board[Piece.BlackKing]);
		for (const sq of blackKings) score -= PST.midgame[Piece.BlackKing][sq];

		return score;
	}
}
