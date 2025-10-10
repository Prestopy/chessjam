"use client";
import {useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import {Board, Move, standardChessSetup} from "@/app/utils";
import {Color} from "@/app/utils";
import ProgressBar from "@/app/Components/ProgressBar";

export default function Tester() {
	const games = 100;

	const chessGames = useRef<Chess[]>([]);
	const [chessPositions, setChessPositions] = useState<Board[]>([]);
	const gameOvers = useRef<boolean[]>([]);
	const gameLoops = useRef<NodeJS.Timeout[]>([]);

	const [winners, setWinners] = useState<(Color | null)[]>([]);

	useEffect(() => {
		const initializedGames: Chess[] = [];
		const initializedBoards: Board[] = [];
		const initializedOvers: boolean[] = [];
		const initializedWinners: (Color | null)[] = [];

		for (let i = 0; i < games; i++) {
			const newGame = new Chess(8, 8).generateBoard(standardChessSetup);
			initializedGames.push(newGame);
			initializedBoards.push(newGame.getBoard());
			initializedOvers.push(false);
			initializedWinners.push(null);
		}

		chessGames.current = initializedGames;
		gameOvers.current = initializedOvers;
		setChessPositions(initializedBoards);
		setWinners(initializedWinners);

		const loops: NodeJS.Timeout[] = initializedGames.map((game, i) =>
			setInterval(() => {
				if (gameOvers.current[i]) return;

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
					gameOvers.current[i] = true;
					return;
				}

				let success = false;
				while (!success) {
					const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
					const move: Move = {
						fromRow: randomPiece.position.row,
						fromCol: randomPiece.position.col,
						toRow: Math.floor(Math.random() * game.getRanks()),
						toCol: Math.floor(Math.random() * game.getFiles()),
					};
					success = game.move(move);
				}

				setChessPositions((prev) => {
					const newPositions = [...prev];
					newPositions[i] = game.getBoard();
					return newPositions;
				});

				if (
					!game
						.getBoard()
						.flat()
						.some((p) => p?.name === "King" && p?.color !== game.getTurn())
				) {
					gameOvers.current[i] = true;
					setWinners((prev) => {
						const newWinners = [...prev];
						newWinners[i] = game.getTurn();
						return newWinners;
					})
					return;
				}

				game.nextTurn();
			}, 100)
		);

		gameLoops.current = loops;

		return () => loops.forEach((loop) => clearInterval(loop));
	}, []);

	return (
		<div className="w-screen h-screen overflow-y-hidden flex flex-row justify-around">
			<div className="py-24">
				<h1 className="text-4xl font-mono font-bold mb-5">Stats</h1>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Completed:</label>
					<ProgressBar
						segments={[
							{
								value: gameOvers.current.reduce((accum, over) => over ? accum + 1 : accum, 0) / games * 100,
								color: "#00ff00",
								label: gameOvers.current.reduce((accum, over) => over ? accum + 1 : accum, 0),
								labelColor: "#000000"
							}
						]}
						color="#00ff00"
						background="#ff0000"
						width={200}
						height={20}
					/>
				</div>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Wins:</label>
					<ProgressBar
						segments={[
							{
								value: winners.reduce((accum, p) => {
									if (p === null) return accum;
									return p === "W" ? accum + 1 : accum;
								}, 0)/games*100,
								color: "#ffffff",
								label: winners.reduce((accum, p) => {
									if (p === null) return accum;
									return p === "W" ? accum + 1 : accum;
								}, 0),
								labelColor: "#000000"
							},
							{
								value: winners.reduce((accum, p) => {
									if (p === null) return accum;
									return p === "B" ? accum + 1 : accum;
								}, 0)/games*100,
								color: "#000000",
								label: winners.reduce((accum, p) => {
									if (p === null) return accum;
									return p === "B" ? accum + 1 : accum;
								}, 0),
								labelColor: "#ffffff"
							},
							{
								value: (games-(winners.reduce((accum, p) => {
									if (p === null) return accum;
									return p === "W" ? accum + 1 : accum;
								}, 0)+winners.reduce((accum, p) => {
									if (p === null) return accum;
									return p === "B" ? accum + 1 : accum;
								}, 0)))/games*100,
								color: "#ffaa00"
							},
						]}
						background="red"
						width={300}
						height={20}
					/>
				</div>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Average pieces left:</label>
					<p>
						{
							winners.reduce((accum, p) => {
								if (p !== null) return accum + 1;
								return accum;
							}, 0) === 0 ? "--" : Math.round(chessPositions.reduce((accum, g, i) => {
								console.log(winners[i])
								if (winners[i] !== null) {
									return accum + g.reduce((sum, row) => sum + row.filter(p => p !== null).length, 0);
								}
								return accum;
							}, 0) / winners.reduce((accum, p) => {
								if (p !== null) return accum + 1;
								return accum;
							}, 0)*100)/100
						}
					</p>
				</div>
			</div>


			<div className="w-fit h-full grid grid-cols-3 gap-5 overflow-y-auto px-24 py-24">
				{chessPositions.map((board, i) => (
					<div className="h-fit flex flex-col items-center justify-center w-full" key={i}>
						<div className="h-8 mb-2">
							{gameOvers.current[i] && (
								<p className="text-center text-xl font-mono font-bold">
									{(winners[i] === "W" ? "White" : "Black") + " win"}
								</p>
							)}
						</div>
						<ChessboardDisplay
							key={i}
							squareDim={32}
							chessboard={board}
							onMove={(move: Move) => {}}
							displayCoordinates={false}
						/>
					</div>
				))}
			</div>
		</div>
	);
}