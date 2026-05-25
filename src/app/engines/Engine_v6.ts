import {Chess} from "@/app/Chess";
import Engine_v5 from "@/app/engines/Engine_v5";
import {PST} from "@/app/engines/pst";
import {Color, GameStage, Piece} from "@/app/utils/types";

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

	getPST(piece: Piece) {
		if (!this.chessGame) return PST[GameStage.Midgame][piece]; // Default to Midgame if no game context
		const k = this.chessGame.getPhaseValue()/24; // TODO: Don't inline; calculate max in Chess.ts

		const v1 = PST[GameStage.Midgame][piece];
		const v2 = PST[GameStage.Endgame][piece];

		// interpolate between mid and endgame PST
		return v1.map((val, idx) => Math.round(val * (1 - k) + v2[idx] * k));
	}

	// Static PST evaluation (Always returns score from White's perspective)
	evaluatePST(position: Chess): number {
		let score = 0;
		const board = position.getBoard();

		// --- 1. PAWNS ---
		const whitePawns = getSquareIndices(board[Piece.WhitePawn]);
		for (const sq of whitePawns) score += this.getPST(Piece.WhitePawn)[sq];

		const blackPawns = getSquareIndices(board[Piece.BlackPawn]);
		for (const sq of blackPawns) score -= this.getPST(Piece.BlackPawn)[sq];

		// --- 2. BISHOPS ---
		const whiteBishops = getSquareIndices(board[Piece.WhiteBishop]);
		for (const sq of whiteBishops) score += this.getPST(Piece.WhiteBishop)[sq];

		const blackBishops = getSquareIndices(board[Piece.BlackBishop]);
		for (const sq of blackBishops) score -= this.getPST(Piece.BlackBishop)[sq];

		// --- 3. KNIGHTS ---
		const whiteKnights = getSquareIndices(board[Piece.WhiteKnight]);
		for (const sq of whiteKnights) score += this.getPST(Piece.WhiteKnight)[sq];

		const blackKnights = getSquareIndices(board[Piece.BlackKnight]);
		for (const sq of blackKnights) score -= this.getPST(Piece.BlackKnight)[sq];

		// --- 4. ROOKS ---
		const whiteRooks = getSquareIndices(board[Piece.WhiteRook]);
		for (const sq of whiteRooks) score += this.getPST(Piece.WhiteRook)[sq];

		const blackRooks = getSquareIndices(board[Piece.BlackRook]);
		for (const sq of blackRooks) score -= this.getPST(Piece.BlackRook)[sq];

		// --- 5. QUEENS ---
		const whiteQueens = getSquareIndices(board[Piece.WhiteQueen]);
		for (const sq of whiteQueens) score += this.getPST(Piece.WhiteQueen)[sq];

		const blackQueens = getSquareIndices(board[Piece.BlackQueen]);
		for (const sq of blackQueens) score -= this.getPST(Piece.BlackQueen)[sq];

		// --- 6. KINGS ---
		const whiteKings = getSquareIndices(board[Piece.WhiteKing]);
		for (const sq of whiteKings) score += this.getPST(Piece.WhiteKing)[sq];

		const blackKings = getSquareIndices(board[Piece.BlackKing]);
		for (const sq of blackKings) score -= this.getPST(Piece.BlackKing)[sq];

		return score;
	}
}
