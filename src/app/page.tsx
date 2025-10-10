"use client";
import {useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import {Move, pieceSymbols, randomPiece, randomPieceOrEmpty, standardChessSetup} from "@/app/utils";

export default function Home() {
	const chessGame = useRef(new Chess(8, 8).generateBoard(standardChessSetup));
	const [chessPosition, setChessPosition] = useState(chessGame.current.getBoard());

	useEffect(() => {
		console.log(chessGame)
	}, [chessGame]);

	const handleMove = (move: Move) => {
		const success = chessGame.current.move(move);
		if (!success) chessGame.current.nextTurn();

		setChessPosition(chessGame.current.getBoard());
	}

	const gameOver = useRef(false) // TODO: move into class later

	useEffect(() => {
		const int = setInterval(() => {
			if (gameOver.current) {
				clearInterval(int);
				return;
			}
			console.log("yay");

			const pieces = [];
			for (let i = 0; i < chessGame.current.getRanks(); i++) {
				for (let j = 0; j < chessGame.current.getFiles(); j++) {
					const piece = chessGame.current.getSquare(i, j);
					if (piece !== null && piece.color === chessGame.current.getTurn()) {
						pieces.push({piece, position: {row: i, col: j}});
					}
				}
			}

			if (pieces.length === 0) {
				gameOver.current = true;
				return;
			}

			let success = false;

			while (!success) {
				const randomPieceIndex = Math.floor(Math.random() * pieces.length);
				const selectedPiece = pieces[randomPieceIndex];

				const randRow = Math.random() * chessGame.current.getRanks();
				const randCol = Math.random() * chessGame.current.getFiles();

				const move: Move = {
					fromRow: selectedPiece.position.row,
					fromCol: selectedPiece.position.col,
					toRow: Math.floor(randRow),
					toCol: Math.floor(randCol)
				};

				success = chessGame.current.move(move);
			}

			setChessPosition(chessGame.current.getBoard());

			if (!chessGame.current.getBoard().flat().some((p) => p?.name === "King" && p?.color !== chessGame.current.getTurn())) {
				gameOver.current = true;
				console.log("GAME OVER, " + (chessGame.current.getTurn() === "W" ? "White" : "Black") + " wins!");
				return;
			}

			chessGame.current.nextTurn();
		}, 100);
	}, []);

	const pointCounterWidth = 500;
	return (
		<div className="min-w-screen min-h-screen flex flex-col items-center justify-center">
			<h1 className="text-4xl font-mono font-bold mb-5">{(chessGame.current.getTurn() === "W" ? "White" : "Black") + " to move"}</h1>

			<div className="flex flex-row items-center justify-center gap-4 mb-10">
				<div style={{ width: pointCounterWidth, height: 25, background: "#000000" }}>
					<div style={{ width: pointCounterWidth/(chessGame.current.countPoints("W")+chessGame.current.countPoints("B"))*chessGame.current.countPoints("W"), height: "100%", background: "#ffffff" }} />
				</div>
			</div>

			<div className="flex flex-row justify-betwen gap-5">
				<ChessboardDisplay squareDim={64} chessboard={chessPosition} onMove={handleMove} />
			</div>
		</div>
	);
}
