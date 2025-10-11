import {Chess} from "../Chess";

let game;
let gameOver = false;

self.onmessage = function (e) {
	const {ranks, files, initialBoard, thinkTime} = e.data;
	game = new Chess(ranks, files, initialBoard);

	const loop = setInterval(() => {
		if (gameOver) return;

		const allMoves = game.generateAllMoves(game.getTurn(), true);
		// if (allMoves.length === 0) {
		// 	gameOver = true;
		// 	const winner = game.getTurn() === "white" ? "black" : "white";
		// 	self.postMessage({board: game.getBoard(), winner, gameState: "draw", movesMade: game.getHistory().length});
		// 	clearInterval(loop);
		// 	return;
		// }

		const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
		game.move(randomMove);

		// Check for game over
		const gameDetails = game.getGameDetails();
		if (gameDetails.state !== "running") {
			gameOver = true;
			self.postMessage({board: game.getBoard(), winner: gameDetails.winner, gameState: gameDetails.state, movesMade: game.getHistory().length});
			clearInterval(loop);
			return;
		}

		// Post new board
		self.postMessage({board: game.getBoard(), winner: null, gameState: "running", movesMade: game.getHistory().length});

		game.nextTurn();
	}, thinkTime);
};