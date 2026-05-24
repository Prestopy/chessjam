import {Chess} from "@/app/Chess";
import {Color, Move} from "@/app/bitboardHelpers";


export class Engine {
	chessGame: Chess | null = null;
	color: Color = Color.White;

	constructor(game: Chess | undefined, color: Color | undefined)
	constructor(game?: Chess, color?: Color) {
		if (game) this.chessGame = game;
		if (color) this.color = color;
	}

	setColor(color: Color) {
		this.color = color;
		return this;
	}

	connectTo(game: Chess): Engine {
		this.chessGame = game;
		return this;
	}

	pickMove(): Move | null {
		return null;
	}
}
