"use client";
import { useEffect, useRef, useState } from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import { Chess } from "@/app/Chess";
import {Board, GameState, standardChessSetup} from "@/app/utils";
import { Color } from "@/app/utils";
import ProgressBar from "@/app/Components/ProgressBar";

import { useVirtualizer } from '@tanstack/react-virtual';
import {Move} from "@/app/Move";

interface GameData {
	gameState: GameState;
	movesMade: number;
	winner: Color | null;
}
export default function TesterV2() {
	const [games, setGames] = useState(0);
	const [numGamesInput, setNumGamesInput] = useState(100);
	const [currentlyRunning, setCurrentlyRunning] = useState(false);

	const [chessPositions, setChessPositions] = useState<Board[]>([]);
	const [gameStates, setGameStates] = useState<GameData[]>([]);
	const workerRefs = useRef<Worker[]>([]);

	const [thinkTime, setThinkTime] = useState(10);

	useEffect(() => {
		return () => workerRefs.current.forEach((w) => w.terminate());
	}, []);

	const runSimulation = (games: number) => {
		const initializedStates: GameData[] = [];
		const initializedBoards: Board[] = [];

		for (let i = 0; i < games; i++) {
			initializedStates.push({ gameState: "running", winner: null, movesMade: 0 });
			initializedBoards.push(new Chess(8, 8).generateBoard(standardChessSetup).getBoard());
		}

		setGameStates(initializedStates);
		setChessPositions(initializedBoards);
		workerRefs.current = [];

		initializedBoards.forEach((board, i) => {
			const worker = new Worker(new URL('@/app/worker/chessWorker.js', import.meta.url));
			worker.onmessage = (e) => {
				const {board: updatedBoard, winner, gameState, movesMade} = e.data;

				console.log("Received message")

				// Update board
				setChessPositions((prev) => {
					const newBoards = [...prev];
					newBoards[i] = updatedBoard;
					return newBoards;
				});

				// Update game state
				setGameStates((prev) => {
					const newStates = [...prev];
					newStates[i] = {gameState: gameState, winner, movesMade};
					return newStates;
				});

				if (gameState !== "running") {
					// check if it's the last one to complete
					completed.current++;

					if (completed.current >= games) setCurrentlyRunning(false);
					worker.terminate();
				}
			};
			worker.postMessage({ranks: 8, files: 8, initialBoard: board, thinkTime: thinkTime});
			workerRefs.current.push(worker);
		})
	}

	const handleRun = () => {
		handleClear();

		setGames(numGamesInput);
		runSimulation(numGamesInput);
		setCurrentlyRunning(true);
	}
	const handleClear = () => {
		workerRefs.current.forEach((w) => w.terminate());
		workerRefs.current = [];

		completed.current = 0;

		setChessPositions([]);
		setGameStates([]);

		// setCurrentlyRunning(false); <-- CAN CAUSE RACE CONDITION
	};
	const completed = useRef(0);
	const whiteWins = gameStates.filter((s) => s.winner === "W").length;
	const blackWins = gameStates.filter((s) => s.winner === "B").length;
	const staleOrDraws = gameStates.filter((s) => s.gameState === "stalemate" || s.gameState === "draw").length;

	const avgPiecesLeft =
		completed.current === 0
			? "--"
			: (
				chessPositions.reduce((accum, board, i) => {
					if (gameStates[i].gameState !== "running") {
						return accum + board.flat().filter((p) => p !== null).length;
					}
					return accum;
				}, 0) / completed.current
			).toFixed(2);

	const avgMovesMade =
		completed.current === 0
			? "--"
			: (
				(
					gameStates.reduce((accum, state) => {
						if (state.gameState !== "running") {
							return accum + state.movesMade;
						}
						return accum;
					}, 0) / completed.current
				).toFixed(2)
			)

	const parentRef = useRef(null)

	// The virtualizer
	const displayCols = 3;
	const rowPadding = 24;
	const [cellSize, setCellSize] = useState(32);
	const rowVirtualizer = useVirtualizer({
		count: Math.ceil(games/displayCols),
		getScrollElement: () => parentRef.current,
		estimateSize: () => cellSize*8 + rowPadding,
	})


	useEffect(() => {
		rowVirtualizer.measure();
	}, [cellSize, rowVirtualizer]);


	return (
		<div className="w-screen h-screen overflow-y-hidden flex flex-row justify-around">
			<div className="py-24">
				<h1 className="text-4xl font-mono font-bold mb-5">Match manager</h1>
				<div className="flex flex-row gap-2 mb-2">
					<button className="bg-green-500 px-5 py-2" onClick={handleRun} disabled={currentlyRunning || numGamesInput <= 0 || isNaN(numGamesInput)}>Run</button>
					<button className="bg-red-500 px-5 py-2" onClick={() => {
						handleClear();
						setCurrentlyRunning(false);
					}} disabled={workerRefs.current.length === 0}>Clear</button>
				</div>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Games:</label>
					<input
						className="font-mono border border-white"
						type="number"
						value={numGamesInput === 0 ? "" : numGamesInput}
						onChange={(e) => {
							const value = e.target.value;

							// Allow empty input
							if (value === "") {
								setNumGamesInput(0);
								return;
							}

							let num = parseInt(value);
							if (isNaN(num)) return;

							num = Math.min(Math.max(num, 1), 1000);
							setNumGamesInput(num);
						}}
					/>
				</div>
				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Cell size:</label>
					<select
						className="font-mono border border-white"
						value={cellSize}
						onChange={(e) => {
							const value = parseInt(e.target.value, 10);
							setCellSize(value);
						}}
					>
						<option value={16}>16</option>
						<option value={32}>32</option>
						<option value={48}>48</option>
						<option value={64}>64</option>
						<option value={72}>72</option>
					</select>
				</div>
				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Think time:</label>
					<input
						className="font-mono border border-white"
						type="number"
						value={thinkTime}
						onChange={(e) => {
							const value = e.target.value;

							// Allow empty input
							if (value === "") {
								setThinkTime(0);
								return;
							}

							let num = parseInt(value);
							if (isNaN(num)) return;

							num = Math.min(Math.max(num, 0), 10000);
							setThinkTime(num);
						}}
					/>
				</div>

				<h1 className="text-4xl font-mono font-bold mb-5 mt-10">Stats</h1>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Completed:</label>
					<ProgressBar
						segments={[
							{
								value: (completed.current / games) * 100,
								color: "#00ff00",
								label: completed.current,
								labelColor: "#000",
							},
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
							{ value: (whiteWins / games) * 100, color: "#ffffff", label: whiteWins, labelColor: "#000" },
							{ value: (blackWins / games) * 100, color: "#000000", label: blackWins, labelColor: "#fff" },
							{ value: (staleOrDraws / games) * 100, color: "#ffaa00", label: staleOrDraws, labelColor: "#000" },
						]}
						background="red"
						width={300}
						height={20}
					/>
				</div>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Average pieces left:</label>
					<p>{avgPiecesLeft}</p>
				</div>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Average moves till win:</label>
					<p>{avgMovesMade}</p>
				</div>
			</div>

			<div ref={parentRef} className="h-full overflow-auto px-24 py-24">
				<div
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
						position: "relative",
						width: 32*8*displayCols+rowPadding*(displayCols-1)+"px",
					}}
					className="flex flex-col gap-5"
				>
					{rowVirtualizer.getVirtualItems().map((virtualRow) => {
						const startIndex = virtualRow.index * displayCols;
						const rowBoards = chessPositions.slice(startIndex, startIndex + displayCols);

						return (
							<div
								key={virtualRow.key}
								className="flex flex-row"
								style={{
									gap: rowPadding,
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: `${virtualRow.size}px`,
									transform: `translateY(${virtualRow.start}px)`,
								}}
							>
								{rowBoards.map((board, i) => {
									const idx = virtualRow.index*displayCols+i;
									return (
										<div key={i} className="flex flex-col items-center justify-end">
											{
												gameStates[idx].gameState !== "running" ? (
													<div
														className="flex flex-row justify-center w-full"
														style={{
															color: gameStates[idx].winner === "W" ? "#000" : gameStates[idx].winner === "B" ? "#fff" : "#000",
															background: gameStates[idx].winner === "W" ? "#fff" : gameStates[idx].winner === "B" ? "#000" : "#ffaa00",
														}}
													>
														{
															gameStates[idx].gameState === "stalemate" ? "Stalemate" : gameStates[idx].gameState === "draw" ? "Draw" : (
																<p>{gameStates[idx].winner === "W" ? "White" : "Black"} win (in {gameStates[idx].movesMade} moves)</p>
															)
														}
													</div>
												) : null
											}
											<ChessboardDisplay
												squareDim={cellSize}
												chessboard={board}
												onMove={(_: Move) => {}}
												getHighlights={() => []}
												displayCoordinates={false}

												disable
											/>
										</div>
									)
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}