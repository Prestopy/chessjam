import {Chess} from "@/app/Chess";
import {Engine} from "@/app/engines/Engine";
import {swapColor} from "@/app/utils";
import {Color, Move} from "@/app/bitboardHelpers";

interface Evaluation {
	score: number;
	move: Move;
}

export default class Engine_v4 extends Engine {
	constructor()
	constructor(game?: Chess, color?: Color) {
		super(game, color);
	}

	evaluate(position: Chess): number {
		return position.countPoints(this.color) - position.countPoints(swapColor(this.color));
	}

	pickMove(): Move | null {
		if (!this.chessGame) return null;
		if (this.chessGame.getTurn() !== this.color) return null; // not this engine's turn

		const allMoves = this.chessGame.generateAllMoves(this.color, true);
		if (allMoves.length === 0) return null; // no moves available - should be game over

		const evals: Evaluation[] = allMoves.map(move => {
			const simulatedGame = this.chessGame?.copy();
			if (!simulatedGame) return { move, score: -Infinity }; // should never happen

			simulatedGame.makeMove(move);
			const score = this.evaluate(simulatedGame);
			return { move, score };
		});

		const maxScore = Math.max(...evals.map(e => e.score));
		const bestMoves = evals.filter(e => e.score === maxScore).map(e => e.move);
		return bestMoves[Math.floor(Math.random() * bestMoves.length)];
	}
}
