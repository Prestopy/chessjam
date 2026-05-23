import {Chess} from "../Chess";
import {Engine} from "../engines/Engine";
import {Move} from "@/app/Move";
import {Board, EngineVersion, allEngines} from "@/app/utils";

let game: Chess;
let gameOver = false;

let totalTimeThinking = 0;

let wEngine: Engine | null = null;
let bEngine: Engine | null = null;

self.onmessage = function (e) {
	const {ranks, files, initialBoard, thinkTime, wEngineVer, bEngineVer} : {
		ranks: number,
		files: number,
		initialBoard: Board,
		thinkTime: number,
		wEngineVer: EngineVersion,
		bEngineVer: EngineVersion
	} = e.data;

	game = new Chess(ranks, files, initialBoard);
	wEngine = allEngines.find(e => e.version === wEngineVer)?.getEngine().connectTo(game).setColor("W") ?? null;
	bEngine = allEngines.find(e => e.version === bEngineVer)?.getEngine().connectTo(game).setColor("B") ?? null;

	setInterval(() => {
		if (gameOver || !wEngine || !bEngine || !game) return;

		let engineMove: Move | null;

		// Get move
		const startTime = performance.now(); // Measure #####
		if (game.getTurn() === "W") engineMove = wEngine.pickMove();
		else engineMove = bEngine.pickMove();
		const endTime = performance.now();   // Measure #####


		if (engineMove === null) {
			callGameOver();
			return;
		}

		game.move(engineMove);


		// Check for game over
		const gameDetails = game.getGameDetails();
		if (gameDetails.state !== "running") {
			callGameOver();
			return;
		}

		// Post new board
		const timeThinking = endTime - startTime;
		totalTimeThinking += timeThinking;
		self.postMessage({board: game.getBoard(), winner: null, gameState: "running", movesMade: game.getHistory().length, averageThinkTime: totalTimeThinking / game.getHistory().length});

		game.nextTurn();
	}, thinkTime);
};

function callGameOver() {
	gameOver = true;
	const gameDetails = game.getGameDetails();
	self.postMessage({board: game.getBoard(), winner: gameDetails.winner, gameState: gameDetails.state, movesMade: game.getHistory().length, averageThinkTime: totalTimeThinking / game.getHistory().length});
	return;
}
