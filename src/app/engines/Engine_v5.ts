import {Chess} from "@/app/Chess";
import {Engine} from "@/app/engines/Engine";
import {swapColor} from "@/app/utils/utils";
import {isCaptureMove, moveFromCol, moveFromRow, moveToCol, moveToRow} from "@/app/Move";
import {Color, Move} from "@/app/utils/types";

export default class Engine_v5 extends Engine {
	// Internal counter to track performance metrics across recursive calls
	private nodesVisitedCount = 0;

	constructor()
	constructor(game?: Chess, color?: Color) {
		super(game, color);
	}

	search(depth: number, alpha: number, beta: number, position: Chess, currentTurnColor: Color): number {
		// Increment our telemetry node counter on every position visited
		this.nodesVisitedCount++;

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
			return bIsCapture - aIsCapture;
		});

		for (const move of moves) {
			position.makeMove(move);
			position.nextTurn();
			const currEval = -this.search(depth - 1, -beta, -alpha, position, swapColor(currentTurnColor));
			position.unmakeMove(move);

			if (currEval >= beta) {
				return beta;
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

		// Reset tracking variables before starting our calculation loop
		this.nodesVisitedCount = 0;
		const startTime = performance.now();
		const targetDepth = 3;

		let bestScore = -Infinity;
		let bestMoves: Move[] = [];
		let alpha = -Infinity;

		const simulatedGame = this.chessGame.clone();

		for (let i = 0; i < allMoves.length; i++) {
			const move = allMoves[i];
			const moveResult = simulatedGame.makeMove(move);
			if (!moveResult.ok) continue;

			simulatedGame.nextTurn();

			const score = -this.search(targetDepth, -Infinity, -alpha, simulatedGame, swapColor(this.color));

			simulatedGame.unmakeMove(move);

			if (score > bestScore) {
				bestScore = score;
				alpha = score;
				bestMoves = [move];
			} else if (score === bestScore) {
				bestMoves.push(move);
			}

			// Generate a readable coordinate preview string for the side panel (e.g., "e2 -> e4")
			const currentBest = bestMoves[0];
			let bestMoveString = "None";
			if (currentBest) {
				const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
				const fromSquare = `${files[moveFromCol(currentBest)]}${8 - moveFromRow(currentBest)}`;
				const toSquare = `${files[moveToCol(currentBest)]}${8 - moveToRow(currentBest)}`;
				bestMoveString = `${fromSquare} → ${toSquare}`;
			}

			// Broadcast live analytics telemetry frames directly up to the React side panel
			this.publishDiagnostics({
				nodesVisited: this.nodesVisitedCount,
				depthReached: targetDepth,
				currentEval: bestScore === -Infinity ? 0 : bestScore,
				timeElapsedMs: Math.round(performance.now() - startTime),
				bestMove: bestMoveString
			});
		}

		return bestMoves[Math.floor(Math.random() * bestMoves.length)] || null;
	}
}
