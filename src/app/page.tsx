"use client";
import {useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import {Move, pieceSymbols, randomPiece, randomPieceOrEmpty, standardChessSetup} from "@/app/utils";

export default function Home() {
	const chessGame = useRef(new Chess(8, 8).generateBoard(standardChessSetup));
	const [chessPosition, setChessPosition] = useState(chessGame.current.getBoard());

	const handleMove = (move: Move) => {
		const success = chessGame.current.move(move);
		if (success) chessGame.current.nextTurn();

		setChessPosition(chessGame.current.getBoard());
	}

	const gameOver = useRef(false) // TODO: move into class later

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
				<ChessboardDisplay
					squareDim={64}
					chessboard={chessPosition}
					onMove={handleMove}
					getHighlights={(r: number, c: number) => chessGame.current.getTurn() !== chessGame.current.getSquare(r, c)?.color ? [] : chessGame.current.getValidMoves(r, c).map(m => ({row: m.toRow, col: m.toCol}))}
				/>
			</div>
		</div>
	);
}
