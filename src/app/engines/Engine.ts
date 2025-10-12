import {Chess} from "@/app/Chess";
import {Move} from "@/app/Move";
import {Color} from "@/app/utils";


export class Engine {
	chessGame: Chess | null = null;
	color: Color | null = null;

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