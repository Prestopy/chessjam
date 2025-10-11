"use client";
import {useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import {GameDetails, standardChessSetup} from "@/app/utils";
import {Move} from "@/app/Move";

export default function Home() {
	const chessGame = useRef(new Chess(8, 8).generateBoard(standardChessSetup));
	const [chessPosition, setChessPosition] = useState(chessGame.current.getBoard());
	const [gameState, setGameState] = useState<GameDetails>({
		state: "running",
		winner: null
	});

	const handleMove = (move: Move) => {
		const success = chessGame.current.move(move);
		if (success) chessGame.current.nextTurn();

		setChessPosition(chessGame.current.getBoard());
		setGameState(chessGame.current.getGameDetails());
	}

	const pointCounterWidth = 500;
	return (
		<div className="min-w-screen min-h-screen flex flex-col items-center justify-center">
			<h1 className="text-4xl font-mono font-bold mb-5">{(chessGame.current.getTurn() === "W" ? "White" : "Black") + " to move"}</h1>

			<div className="flex flex-row items-center justify-center gap-4 mb-10">
				<div style={{ width: pointCounterWidth, height: 25, background: "#000000" }}>
					<div style={{ width: pointCounterWidth/(chessGame.current.countPoints("W")+chessGame.current.countPoints("B"))*chessGame.current.countPoints("W"), height: "100%", background: "#ffffff" }} />
				</div>
			</div>

			<div className="flex flex-col justify-betwen">
				<div
					className="w-full h-8 flex flex-row justify-center items-center"
					style={{
						color: gameState.winner === "W" ? "#000" : gameState.winner === "B" ? "#fff" : "#000",
						background: gameState.winner === "W" ? "#fff" : gameState.winner === "B" ? "#000" : "#ffaa00",
						visibility: gameState.state === "running" ? "hidden" : "visible",
					}}
				>
					{
						gameState.state === "running" ? null : gameState.state === "stalemate" || gameState.state === "draw" ? "Stalemate/Draw" : (
							<p>{gameState.winner === "W" ? "White" : "Black"} win</p>
						)
					}
				</div>
				<ChessboardDisplay
					squareDim={64}
					chessboard={chessPosition}
					onMove={handleMove}
					getHighlights={(r: number, c: number) => chessGame.current.getTurn() !== chessGame.current.getSquare(r, c)?.color ? [] : chessGame.current.generateMoves(r, c, true).map(m => ({row: m.toRow, col: m.toCol}))}

					disable={gameState.state !== "running"}
				/>
			</div>
		</div>
	);
}
