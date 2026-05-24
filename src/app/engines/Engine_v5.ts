import {Chess} from "@/app/Chess";
import {Engine} from "@/app/engines/Engine";
import {swapColor} from "@/app/utils";
import {Color, Move} from "@/app/bitboardHelpers";
import {isCaptureMove} from "@/app/Move";

export default class Engine_v5 extends Engine {
	constructor()
	constructor(game?: Chess, color?: Color) {
		super(game, color);
	}

	search(depth: number, alpha: number, beta: number, position: Chess, currentTurnColor: Color): number {
		const moves = position.generateAllMoves(currentTurnColor, true);

		if (moves.length === 0) {
			return position.isInCheck(currentTurnColor) ? -Infinity : 0;
		}

		if (depth === 0) {
			return this.evaluate(position, currentTurnColor);
		}

		moves.sort((a, b) => {
			const aIsCapture = isCaptureMove(a) ? 1 : 0;
			const bIsCapture = isCaptureMove(b) ? 1 : 0;
			return bIsCapture - aIsCapture; // 1 pushes a capture forward, 0 keeps it back
		});

		for (const move of moves) {
			position.makeMove(move);
			position.nextTurn(); // Ensure the turn flags advance inside the clone
			const currEval = -this.search(depth - 1, -beta, -alpha, position, swapColor(currentTurnColor));
			position.unmakeMove(move);

			if (currEval >= beta) {
				return beta; // Prune branch safely
			}
			alpha = Math.max(alpha, currEval);
		}

		return alpha;
	}

	evaluate(position: Chess, currentTurnColor: Color): number {
		return position.countPoints(currentTurnColor) - position.countPoints(swapColor(currentTurnColor));
	}

	pickMove(): Move | null {
		if (!this.chessGame) return null;
		const activeColor = this.chessGame.getTurn();
		if (activeColor !== this.color) return null;

		const allMoves = this.chessGame.generateAllMoves(this.color, true);
		if (allMoves.length === 0) return null;

		let bestScore = -Infinity;
		let bestMoves: Move[] = [];

		let alpha = -Infinity;

		const simulatedGame = this.chessGame.copy();
		for (const move of allMoves) {
			simulatedGame.makeMove(move);
			simulatedGame.nextTurn();

			// Pass the running alpha down to prune alternative root moves early!
			const score = -this.search(2, -Infinity, -alpha, simulatedGame, swapColor(this.color));

			simulatedGame.unmakeMove(move);

			if (score > bestScore) {
				bestScore = score;
				alpha = score; // Tighten the alpha window for the next moves!
				bestMoves = [move];
			} else if (score === bestScore) {
				bestMoves.push(move);
			}
		}

		// Pick randomly among tied items to keep engine play dynamic
		return bestMoves[Math.floor(Math.random() * bestMoves.length)] || null;
	}
}
