import {Chess} from "../Chess";
import {Engine} from "../engines/Engine";
import {Board, Color, GameState, Move} from "@/app/utils/types";
import {allEngines, EngineVersion} from "@/app/engines/engineDetails";

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
	wEngine = allEngines.find(e => e.version === wEngineVer)?.getEngine().connectTo(game).setColor(Color.White) ?? null;
	bEngine = allEngines.find(e => e.version === bEngineVer)?.getEngine().connectTo(game).setColor(Color.Black) ?? null;

	setInterval(() => {
		if (gameOver || !wEngine || !bEngine || !game) return;

		let engineMove: Move | null;

		// Get move
		const startTime = performance.now(); // Measure #####
		if (game.getTurn() === Color.White) engineMove = wEngine.pickMove();
		else engineMove = bEngine.pickMove();
		const endTime = performance.now();   // Measure #####

		if (engineMove === null) {
			callGameOver();
			return;
		}

		game.move(engineMove);

		// Check for game over
		const gameDetails = game.getGameDetails();
		if (gameDetails.state !== GameState.Running) {
			callGameOver();
			return;
		}

		// Post new board
		const timeThinking = endTime - startTime;
		totalTimeThinking += timeThinking;


		const buffer = buildBuffer().buffer;
		// @ts-expect-error it works :shrug:
		self.postMessage({ buffer }, [buffer]);

		game.nextTurn();
	}, thinkTime);
};

function buildBuffer() {
	const buffer = new BigInt64Array(16); // Placeholder for transferable data if needed
	const board = game.getBoard();
	for (let i=0; i<12; i++) buffer[i] = board[i];

	const gameDetails = game.getGameDetails();

	buffer[12] = BigInt(gameDetails.state);
	buffer[13] = gameDetails.winner ? BigInt(gameDetails.winner) : 2n; // 2n: no color
	buffer[14] = BigInt(game.getHistory().length);
	buffer[15] = BigInt(Math.round(totalTimeThinking / game.getHistory().length));

	return buffer;
}

function callGameOver() {
	gameOver = true;

	const buffer = buildBuffer().buffer;
	// @ts-expect-error it works :shrug:
	self.postMessage({ buffer }, [buffer]);
	return;
}
