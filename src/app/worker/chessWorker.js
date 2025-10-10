import {Chess} from "../Chess";

let game;
let winner = null;
let gameOver = false;

self.onmessage = function (e) {
	const {ranks, files, initialBoard, thinkTime} = e.data;
	game = new Chess(ranks, files, initialBoard);

	const loop = setInterval(() => {
		if (gameOver) return;

		const pieces = [];
		for (let r = 0; r < game.getRanks(); r++) {
			for (let c = 0; c < game.getFiles(); c++) {
				const piece = game.getSquare(r, c);
				if (piece && piece.color === game.getTurn()) {
					pieces.push({piece, position: {row: r, col: c}});
				}
			}
		}

		if (pieces.length === 0) {
			gameOver = true;
			self.postMessage({board: game.getBoard(), winner: null, gameOver: true, movesMade: game.getHistory().length});
			clearInterval(loop);
			return;
		}

		const allMoves = game.getAllValidMoves(game.getTurn());
		if (allMoves.length === 0) {
			gameOver = true;
			winner = game.getTurn() === "white" ? "black" : "white";
			self.postMessage({board: game.getBoard(), winner, gameOver: true, movesMade: game.getHistory().length});
			clearInterval(loop);
			return;
		}

		const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
		game.move(randomMove);

		if (
			!game
				.getBoard()
				.flat()
				.some((p) => p?.name === "King" && p?.color !== game.getTurn())
		) {
			gameOver = true;
			winner = game.getTurn();
			self.postMessage({board: game.getBoard(), winner, gameOver: true, movesMade: game.getHistory().length});
			clearInterval(loop);
			return;
		}

		game.nextTurn();
		self.postMessage({board: game.getBoard(), winner, gameOver: false, movesMade: game.getHistory().length});
	}, thinkTime);
};