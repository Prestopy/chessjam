import { Chess } from "@/app/Chess";
import { Color, Move, EngineDiagnostics } from "@/app/utils/types";

export class Engine {
	chessGame: Chess | null = null;
	color: Color = Color.White;

	// Callback to push live data to the UI
	onDiagnosticsUpdate?: (data: EngineDiagnostics) => void;

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

	// Assign diagnostic listener from UI
	setDiagnosticsListener(callback: (data: EngineDiagnostics) => void): Engine {
		this.onDiagnosticsUpdate = callback;
		return this;
	}

	publishDiagnostics(data: EngineDiagnostics) {
		if (this.onDiagnosticsUpdate) {
			this.onDiagnosticsUpdate(data);
		}
	}

	pickMove(): Move | null {
		return null;
	}
}
