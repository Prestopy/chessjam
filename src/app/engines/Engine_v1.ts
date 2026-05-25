import {Chess} from "@/app/Chess";
import {Engine} from "@/app/engines/Engine";
import {Color, Move} from "@/app/utils/types";

export default class Engine_v1 extends Engine {
	constructor()
	constructor(game?: Chess, color?: Color) {
		super(game, color);
	}

	pickMove(): Move | null {
		if (!this.chessGame) return null;
		if (this.chessGame.getTurn() !== this.color) return null; // not this engine's turn

		const allMoves = this.chessGame.generateAllMoves(this.color, true);
		if (allMoves.length === 0) return null; // no moves available - should be game over

		return allMoves[Math.floor(Math.random() * allMoves.length)];
	}
}
