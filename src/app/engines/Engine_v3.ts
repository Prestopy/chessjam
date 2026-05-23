import {Chess} from "@/app/Chess";
import {Engine} from "@/app/engines/Engine";
import {Move} from "@/app/Move";
import {Color} from "@/app/utils";

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
		if (!this.chessGame || !this.color) return null;
		if (this.chessGame.getTurn() !== this.color) return null; // not this engine's turn

		const allMoves = this.chessGame.generateAllMoves(this.color, true);
		if (allMoves.length === 0) return null; // no moves available - should be game over

		const evals: Evaluation[] = allMoves.map(m => {
			let score = 0;
			switch (this.chessGame?.getBoard()[m.fromRow][m.fromCol]?.name) {
				case "Pawn":
					score += 5;
					break;
				case "Knight":
				case "Bishop":
					score += 1;
					break;
				case "Rook":
					score += 2;
					break;
				case "Queen":
					score += 3;
					break;
			}

			if (m.isCaptureMove()) {
				score += 5;
				const capturedPiece = m.getCapturedPiece();
				if (capturedPiece) {
					switch (capturedPiece.name) {
						case "Pawn":
							score += 1;
							break;
						case "Knight":
						case "Bishop":
							score += 3;
							break;
						case "Rook":
							score += 5;
							break;
						case "Queen":
							score += 9;
							break;
					}
				}
			}
			if (m.isPromotionMove()) score += 10;
			if (m.isCastleMove()) score += 5;
			if (m.isEnPassantMove()) score += 2; // For the fun you know lol

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