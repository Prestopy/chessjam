import {Chess} from "@/app/Chess";
import {Engine} from "@/app/engines/Engine";
import {
	isCaptureMove,
	isCastleMove,
	isEnPassantMove,
	isPromotionMove,
	moveCaptured, moveFromCol,
	moveFromRow
} from "@/app/Move";
import {Color, Move, pieceName, PieceName} from "@/app/bitboardHelpers";

interface Evaluation {
	move: Move;
	score: number;
}
export default class Engine_v3 extends Engine {
	constructor()
	constructor(game?: Chess, color?: Color) {
		super(game, color);
	}

	pickMove(): Move | null {
		if (!this.chessGame) return null;
		if (this.chessGame.getTurn() !== this.color) return null; // not this engine's turn

		const allMoves = this.chessGame.generateAllMoves(this.color, true);
		if (allMoves.length === 0) return null; // no moves available - should be game over

		const evals: Evaluation[] = allMoves.map(m => {
			let score = 0;
			const piece = this.chessGame?.getSquare(moveFromRow(m), moveFromCol(m));
			if (piece) {
				switch (pieceName(piece)) {
					case PieceName.Pawn:
						score += 1;
						break;
					case PieceName.Knight:
					case PieceName.Bishop:
						score += 3;
						break;
					case PieceName.Rook:
						score += 5;
						break;
					case PieceName.Queen:
						score += 9;
						break;
				}
			}

			if (isCaptureMove(m)) {
				score += 5;
				const capturedPiece = moveCaptured(m);
				if (capturedPiece) {
					switch (pieceName(capturedPiece)) {
						case PieceName.Pawn:
							score += 1;
							break;
						case PieceName.Knight:
						case PieceName.Bishop:
							score += 3;
							break;
						case PieceName.Rook:
							score += 5;
							break;
						case PieceName.Queen:
							score += 9;
							break;
					}
				}
			}
			if (isPromotionMove(m)) score += 10;
			if (isCastleMove(m)) score += 5;
			if (isEnPassantMove(m)) score += 2; // For the fun you know lol

			return {
				move: m,
				score: score
			}
		});

		const maxScore = Math.max(...evals.map(e => e.score));
		const bestMoves = evals.filter(e => e.score === maxScore).map(e => e.move);
		return bestMoves[Math.floor(Math.random() * bestMoves.length)];
	}
}
