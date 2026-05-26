import {Chess} from "../Chess";
import {Engine} from "../engines/Engine";
import {Board, Color, GameState, Move} from "@/app/utils/types";
import {allEngines, EngineVersion} from "@/app/engines/engineDetails";

let game: Chess;
let gameOver = false;

let totalTimeThinkingW = 0;
let totalTimeThinkingB = 0;
let totalMovesW = 0;
let totalMovesB = 0;

let wEngine: Engine | null = null;
let bEngine: Engine | null = null;

self.onmessage = function (e) {
	const {ranks, files, initialBoard, thinkTime, wEngineVer, bEngineVer, measure} : {
		ranks: number,
		files: number,
		initialBoard: Board,
		thinkTime: number,
		wEngineVer: EngineVersion,
		bEngineVer: EngineVersion,
		measure?: boolean
	} = e.data;

	game = new Chess(ranks, files, initialBoard);
	wEngine = allEngines.find(e => e.version === wEngineVer)?.getEngine().connectTo(game).setColor(Color.White) ?? null;
	bEngine = allEngines.find(e => e.version === bEngineVer)?.getEngine().connectTo(game).setColor(Color.Black) ?? null;

	if (measure) {
		while (!gameOver && wEngine && bEngine && game) {
			let engineMove: Move | null;
			const isWhiteTurn = game.getTurn() === Color.White;

			const startTime = performance.now();
			if (isWhiteTurn) {
				engineMove = wEngine.pickMove();
				totalMovesW++;
			} else {
				engineMove = bEngine.pickMove();
				totalMovesB++;
			}
			const endTime = performance.now();

			if (engineMove === null) {
				callGameOver();
				break;
			}

			game.move(engineMove);

			const gameDetails = game.getGameDetails();
			const timeThinking = endTime - startTime;
			if (isWhiteTurn) totalTimeThinkingW += timeThinking;
			else totalTimeThinkingB += timeThinking;

			if (gameDetails.state !== GameState.Running) {
				callGameOver();
				break;
			}

			game.nextTurn();
		}
	} else {
		setInterval(() => {
			if (gameOver || !wEngine || !bEngine || !game) return;

			let engineMove: Move | null;
			const isWhiteTurn = game.getTurn() === Color.White;

			const startTime = performance.now();
			if (isWhiteTurn) {
				engineMove = wEngine.pickMove();
				totalMovesW++;
			} else {
				engineMove = bEngine.pickMove();
				totalMovesB++;
			}
			const endTime = performance.now();

			if (engineMove === null) {
				callGameOver();
				return;
			}

			game.move(engineMove);

			const gameDetails = game.getGameDetails();
			const timeThinking = endTime - startTime;
			if (isWhiteTurn) totalTimeThinkingW += timeThinking;
			else totalTimeThinkingB += timeThinking;

			if (gameDetails.state !== GameState.Running) {
				callGameOver();
				return;
			}

			const buffer = buildBuffer().buffer;
			// @ts-expect-error it works :shrug:
			self.postMessage({ buffer }, [buffer]);

			game.nextTurn();
		}, thinkTime);
	}
};

function buildBuffer() {
	const buffer = new BigInt64Array(18);
	const board = game.getBoard();
	for (let i = 0; i < 12; i++) buffer[i] = board[i];

	const gameDetails = game.getGameDetails();

	buffer[12] = BigInt(gameDetails.state);
	buffer[13] = gameDetails.winner !== null ? BigInt(gameDetails.winner) : 2n;
	buffer[14] = BigInt(game.getHistory().length);
	buffer[15] = BigInt(0);

	// Safely fallback to 0 instead of NaN if an engine never moved (e.g., immediate checkmate or draw)
	buffer[16] = BigInt(totalMovesW > 0 ? Math.round(totalTimeThinkingW / totalMovesW) : 0);
	buffer[17] = BigInt(totalMovesB > 0 ? Math.round(totalTimeThinkingB / totalMovesB) : 0);

	return buffer;
}

function callGameOver() {
	gameOver = true;

	const buffer = buildBuffer().buffer;
	// @ts-expect-error it works :shrug:
	self.postMessage({ buffer }, [buffer]);
	return;
}
