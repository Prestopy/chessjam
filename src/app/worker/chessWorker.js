import {Chess} from "../Chess";

let game;
let gameOver = false;

let totalTimeThinking = 0;

self.onmessage = function (e) {
	const {ranks, files, initialBoard, thinkTime} = e.data;
	game = new Chess(ranks, files, initialBoard);

	const loop = setInterval(() => {
		if (gameOver) return;

		let startTime = performance.now();

		const allMoves = game.generateAllMoves(game.getTurn(), true);
		const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];

		let endTime = performance.now();

		game.move(randomMove);


		// Check for game over
		const gameDetails = game.getGameDetails();
		if (gameDetails.state !== "running") {
			gameOver = true;
			self.postMessage({board: game.getBoard(), winner: gameDetails.winner, gameState: gameDetails.state, movesMade: game.getHistory().length, averageThinkTime: totalTimeThinking / game.getHistory().length});
			clearInterval(loop);
			return;
		}

		// Post new board
		let timeThinking = endTime - startTime;
		totalTimeThinking += timeThinking;
		self.postMessage({board: game.getBoard(), winner: null, gameState: "running", movesMade: game.getHistory().length, averageThinkTime: totalTimeThinking / game.getHistory().length});

		game.nextTurn();
	}, thinkTime);
};