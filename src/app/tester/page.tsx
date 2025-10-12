"use client";
import { useEffect, useRef, useState } from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import { Chess } from "@/app/Chess";
import {Board, EngineVersion, GameState, standardChessSetup, allEngines} from "@/app/utils";
import { Color } from "@/app/utils";
import ProgressBar from "@/app/Components/ProgressBar";

import { useVirtualizer } from '@tanstack/react-virtual';
import {Move} from "@/app/Move";

interface GameData {
	gameState: GameState;

	engines: {
		W: EngineVersion;
		B: EngineVersion;
	} | null

	movesMade: number;
	winner: Color | null;
	averageThinkTime: number;
}
export default function TesterV2() {
	const [games, setGames] = useState(0);
	const [numGamesInput, setNumGamesInput] = useState(100);
	const [currentlyRunning, setCurrentlyRunning] = useState(false);

	const [chessPositions, setChessPositions] = useState<Board[]>([]);
	const [gameStates, setGameStates] = useState<GameData[]>([]);
	const workerRefs = useRef<Worker[]>([]);

	const [engine1, setEngine1] = useState<EngineVersion>("1");
	const [engine2, setEngine2] = useState<EngineVersion>("1");

	const [engine1Wins, setEngine1Wins] = useState(0);
	const [engine2Wins, setEngine2Wins] = useState(0);

	const [thinkTime, setThinkTime] = useState(10);

	useEffect(() => {
		return () => workerRefs.current.forEach((w) => w.terminate());
	}, []);

	const runSimulation = (games: number, measure: boolean) => {
		const initializedStates: GameData[] = [];
		const initializedBoards: Board[] = [];

		for (let i = 0; i < games; i++) {
			initializedStates.push({ gameState: "running", engines: null, winner: null, movesMade: 0, averageThinkTime: 0 });
			initializedBoards.push(new Chess(8, 8).generateBoard(standardChessSetup).getBoard());
		}

		setGameStates(initializedStates);
		setChessPositions(initializedBoards);
		workerRefs.current = [];

		initializedBoards.forEach((board, i) => {
			const worker = new Worker(new URL('@/app/worker/chessWorker.ts', import.meta.url));

			const engine1IsWhite = i < games / 2;

			worker.onmessage = (e) => {
				const {board: updatedBoard, winner, gameState, movesMade, averageThinkTime} = e.data;


				// Update board
				setChessPositions((prev) => {
					const newBoards = [...prev];
					newBoards[i] = updatedBoard;
					return newBoards;
				});

				// Update game state
				setGameStates((prev) => {
					const newStates = [...prev];
					newStates[i] = {gameState, engines: { W: engine1IsWhite ? engine1 : engine2, B: engine1IsWhite ? engine2 : engine1 }, winner, movesMade, averageThinkTime};
					return newStates;
				});

				if (gameState !== "running") {
					// check if it's the last one to complete
					completed.current++;

					if (winner) {
						if (engine1IsWhite && winner === "W" || !engine1IsWhite && winner === "B") setEngine1Wins((prev) => prev + 1);
						else setEngine2Wins((prev) => prev + 1);
					}

					if (completed.current >= games) {
						if (measure) setEndSimTime(performance.now());
						setCurrentlyRunning(false);
					}
					worker.terminate();
				}
			};


			worker.postMessage({ranks: 8, files: 8, initialBoard: board, thinkTime: thinkTime, wEngineVer: engine1IsWhite ? engine1 : engine2, bEngineVer: engine1IsWhite ? engine2 : engine1 });
			workerRefs.current.push(worker);
		})

		if (measure) setStartSimTime(performance.now());
	}

	const handleRun = (measure: boolean = false) => {
		handleClear();

		if (measure) {
			setThinkTime(0);
			setMeasuring(true);
		} else {
			setMeasuring(false);
		}

		setGames(numGamesInput);
		runSimulation(numGamesInput, measure);
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

	const parentRef = useRef(null)

	// The virtualizer
	const cellSizeToCols: {
		[key: number]: number;
	} = {
		16: 8,
		32: 4,
		48: 3,
		// 64: 2,
		72: 2,
	};
	const [cellSize, setCellSize] = useState(32);
	const [displayCols, setDisplayCols] = useState(cellSizeToCols[cellSize]);

	const [measuring, setMeasuring] = useState(false);

	const rowPadding = 24;
	const rowVirtualizer = useVirtualizer({
		count: Math.ceil(games/displayCols),
		getScrollElement: () => parentRef.current,
		estimateSize: () => cellSize*8 + rowPadding,
	})


	useEffect(() => {
		rowVirtualizer.measure();
	}, [cellSize, rowVirtualizer]);


	// MEASURING DATA
	const completed = useRef(0);
	const whiteWins = gameStates.filter((s) => s.winner === "W").length;
	const blackWins = gameStates.filter((s) => s.winner === "B").length;
	const stales = gameStates.filter((s) => s.gameState === "stalemate").length;
	const draws = gameStates.filter((s) => s.gameState === "draw").length;

	const avgPiecesLeft =
		completed.current === 0 || (measuring && currentlyRunning)
			? "--"
			: (
				chessPositions.reduce((accum, board, i) => {
					if (gameStates[i].gameState !== "running") {
						return accum + board.flat().filter((p) => p !== null).length;
					}
					return accum;
				}, 0) / completed.current
			).toFixed(2);

	const avgMovesMadeTillEnd =
		completed.current === 0 || (measuring && currentlyRunning)
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
			);

	const avgThinkTime = !measuring || currentlyRunning
		? "--"
		: (
			gameStates.reduce((accum, state) => accum + state.averageThinkTime, 0) / games
		).toFixed(4);

	const [startSimTime, setStartSimTime] = useState(0);
	const [endSimTime, setEndSimTime] = useState(0);


	return (
		<div className="w-screen h-screen overflow-y-hidden flex flex-row justify-between px-8">
			<div className="py-24">
				<h1 className="text-4xl font-mono font-bold mb-5">Match Manager</h1>
				<div className="flex flex-row gap-2 mb-5">
					<button className="bg-green-500 px-5 py-2" onClick={() => handleRun()} disabled={currentlyRunning || numGamesInput <= 0 || isNaN(numGamesInput)}>Run</button>
					<button className="bg-indigo-500 px-5 py-2" onClick={() => handleRun(true)} disabled={currentlyRunning || numGamesInput <= 0 || isNaN(numGamesInput)}>Run & Measure</button>
					<button className="bg-red-500 px-5 py-2" onClick={() => {
						handleClear();
						setCurrentlyRunning(false);
						setStartSimTime(0);
						setEndSimTime(0);
						setMeasuring(false);
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
					<label className="font-bold">Engine 1:</label>
					<select
						className="font-mono border border-white"
						value={engine1}
						onChange={(e) => setEngine1(e.target.value as EngineVersion)}
					>
						{
							allEngines.map((details, i) => (
								<option key={i} value={details.version}>v{details.version} - {details.name}</option>
							))
						}
					</select>
				</div>
				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Engine 2:</label>
					<select
						className="font-mono border border-white"
						value={engine2}
						onChange={(e) => setEngine2(e.target.value as EngineVersion)}
					>
						{
							allEngines.map((details, i) => (
								<option key={i} value={details.version}>v{details.version} - {details.name}</option>
							))
						}
					</select>
				</div>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Cell size:</label>
					<select
						className="font-mono border border-white"
						value={cellSize}
						onChange={(e) => {
							const value = parseInt(e.target.value, 10);
							setCellSize(value);

							setDisplayCols(cellSizeToCols[value] ?? 3);
						}}
					>
						<option value={16}>16</option>
						<option value={32}>32</option>
						<option value={48}>48</option>
						{/*<option value={64}>64</option>*/}
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

				<h2 className="text-2xl font-mono font-bold mb-3 mt-10">Stats</h2>

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
					<div className="flex flex-col gap-2">
						<ProgressBar
							segments={[
								{ value: (whiteWins / games) * 100, color: "#ffffff", label: whiteWins, labelColor: "#000" },
								{ value: (blackWins / games) * 100, color: "#000000", label: blackWins, labelColor: "#fff" },
								{ value: (stales / games) * 100, color: "#ffaa00", label: stales, labelColor: "#000" },
								{ value: (draws / games) * 100, color: "#595959", label: draws, labelColor: "#fff" },
							]}
							background="red"
							width={300}
							height={20}
						/>
					</div>
				</div>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Engine 1 (v{engine1}) wins:</label>
					<div className="flex flex-col gap-2">
						{engine1Wins} ({engine1Wins+engine2Wins === 0 ? "--" : (engine1Wins / (engine1Wins+engine2Wins))*100}%)
					</div>
				</div>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Engine 2 (v{engine2}) wins:</label>
					<div className="flex flex-col gap-2">
						{engine2Wins} ({engine1Wins+engine2Wins === 0 ? "--" : (engine2Wins / (engine1Wins+engine2Wins))*100}%)
					</div>
				</div>

				<h2 className="text-2xl font-mono font-bold mb-3 mt-10">Fun stats</h2>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Average pieces left:</label>
					<p>{avgPiecesLeft}</p>
				</div>

				<div className="flex flex-row gap-2 items-center">
					<label className="font-bold">Average moves made:</label>
					<p>{avgMovesMadeTillEnd}</p>
				</div>

				{
					measuring && (
						<>
							<h2 className="text-2xl font-mono font-bold mb-3 mt-5">Times</h2>

							<div className="flex flex-row gap-2 items-center">
								<label className="font-bold">Total simulation time:</label>
								<p>{(!currentlyRunning ? ((endSimTime - startSimTime)/1000).toFixed(4) : "--")} s</p>
							</div>

							<div className="flex flex-row gap-2 items-center">
								<label className="font-bold">Average thinking time:</label>
								<p>{avgThinkTime} ms</p>
							</div>
						</>
					)
				}
			</div>

			<div ref={parentRef} className="h-full overflow-auto px-8 py-24">
				{
					measuring || gameStates.length === 0 ? <div /> : (
						<div
							style={{
								height: `${rowVirtualizer.getTotalSize()}px`,
								position: "relative",
								width: cellSize*8*displayCols+rowPadding*(displayCols-1)+"px",
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
																	color: gameStates[idx].winner === "W" ? "#000" : gameStates[idx].winner === "B" ? "#fff" : gameStates[idx].gameState === "stalemate" ? "#000" : "#fff",
																	background: gameStates[idx].winner === "W" ? "#fff" : gameStates[idx].winner === "B" ? "#000" : gameStates[idx].gameState === "stalemate" ? "#ffaa00" : "#595959",
																}}
															>
																{
																	gameStates[idx].gameState === "stalemate" ? "Stalemate" : gameStates[idx].gameState === "draw" ? "Draw" : (
																		<p>{gameStates[idx].winner === "W" ? "White" : "Black"} (v{gameStates[idx].engines![gameStates[idx].winner ?? "W"]}) win</p>
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
					)
				}
			</div>
		</div>
	);
}