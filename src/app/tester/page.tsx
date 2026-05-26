"use client";
import {useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import ProgressBar from "@/app/Components/ProgressBar";

import {useVirtualizer} from '@tanstack/react-virtual';
import {Board, Color, GameState, Move} from "@/app/utils/types";
import {allEngines, EngineVersion} from "@/app/engines/engineDetails";

interface GameData {
	gameState: GameState;

	engines: {
		W: EngineVersion;
		B: EngineVersion;
	} | null

	movesMade: number;
	winner: Color | null;
	avgThinkTimeW: number;
	avgThinkTimeB: number;
}
export default function TesterV2() {
	const [games, setGames] = useState(0);
	const MAX_GAMES = 1500;
	const MAX_VISIBLE_GAMES = 200;
	const [numGamesInput, setNumGamesInput] = useState(100);
	const [currentlyRunning, setCurrentlyRunning] = useState(false);

	const [chessPositions, setChessPositions] = useState<Board[]>([]);
	const [gameStates, setGameStates] = useState<GameData[]>([]);
	const workerRefs = useRef<Worker[]>([]);

	const [engine1, setEngine1] = useState<EngineVersion>("1");
	const [engine2, setEngine2] = useState<EngineVersion>("1");

	// Unified accurate statistics state
	const [stats, setStats] = useState({
		completed: 0,
		whiteWins: 0,
		blackWins: 0,
		stales: 0,
		draws: 0,
		engine1Wins: 0,
		engine2Wins: 0,
		totalEngine1Think: 0,
		totalEngine2Think: 0
	});

	const [thinkTime, setThinkTime] = useState(10);

	useEffect(() => {
		return () => workerRefs.current.forEach((w) => w.terminate());
	}, []);

	const runSimulation = (games: number, measure: boolean, thinkTime: number) => {
		const initializedStates: GameData[] = [];
		const initializedBoards: Board[] = [];

		for (let i = 0; i < games; i++) {
			initializedStates.push({ gameState: GameState.Running, engines: null, winner: null, movesMade: 0, avgThinkTimeW: 0, avgThinkTimeB: 0 });
			initializedBoards.push(new Chess(8, 8).getBoard());
		}

		setGameStates(initializedStates);
		setChessPositions(initializedBoards);
		workerRefs.current = [];

		initializedBoards.forEach((board, i) => {
			const worker = new Worker(new URL('@/app/worker/chessWorker.ts', import.meta.url));

			const engine1IsWhite = i < games / 2;

			worker.onmessage = (e) => {
				const resultBuffer = new BigInt64Array(e.data.buffer);
				const updatedBoard: Board = new BigInt64Array(12) as Board;
				for (let i = 0; i < 12; i++) updatedBoard[i] = resultBuffer[i];

				const gameState = Number(resultBuffer[12]) as GameState;
				const winnerVal = Number(resultBuffer[13]);
				const winner = winnerVal === 2 ? null : (winnerVal as Color);
				const movesMade = Number(resultBuffer[14]);
				const avgThinkTimeW = Number(resultBuffer[16]);
				const avgThinkTimeB = Number(resultBuffer[17]);

				// Update board visual representation
				setChessPositions((prev) => {
					const newBoards = [...prev];
					newBoards[i] = updatedBoard;
					return newBoards;
				});

				// Update game details block
				setGameStates((prev) => {
					const newStates = [...prev];
					newStates[i] = {
						gameState,
						engines: { W: engine1IsWhite ? engine1 : engine2, B: engine1IsWhite ? engine2 : engine1 },
						winner,
						movesMade,
						avgThinkTimeW,
						avgThinkTimeB
					};
					return newStates;
				});

				if (gameState !== GameState.Running) {
					// Instantly log all values to eliminate asynchronous context leaking
					setStats((prev) => {
						const nextCompleted = prev.completed + 1;

						const isWhiteWin = winner === Color.White;
						const isBlackWin = winner === Color.Black;
						const isStale = gameState === GameState.Stalemate;
						const isDraw = gameState === GameState.Draw;

						const e1Won = (engine1IsWhite && isWhiteWin) || (!engine1IsWhite && isBlackWin);
						const e2Won = (!engine1IsWhite && isWhiteWin) || (engine1IsWhite && isBlackWin);

						if (nextCompleted >= games) {
							if (measure) setEndSimTime(performance.now());
							setCurrentlyRunning(false);
						}

						return {
							completed: nextCompleted,
							whiteWins: prev.whiteWins + (isWhiteWin ? 1 : 0),
							blackWins: prev.blackWins + (isBlackWin ? 1 : 0),
							stales: prev.stales + (isStale ? 1 : 0),
							draws: prev.draws + (isDraw ? 1 : 0),
							engine1Wins: prev.engine1Wins + (winner !== null && e1Won ? 1 : 0),
							engine2Wins: prev.engine2Wins + (winner !== null && e2Won ? 1 : 0),
							totalEngine1Think: prev.totalEngine1Think + (engine1IsWhite ? avgThinkTimeW : avgThinkTimeB),
							totalEngine2Think: prev.totalEngine2Think + (engine1IsWhite ? avgThinkTimeB : avgThinkTimeW)
						};
					});

					worker.terminate();
				}
			};

			worker.postMessage({ranks: 8, files: 8, initialBoard: board, thinkTime: thinkTime, wEngineVer: engine1IsWhite ? engine1 : engine2, bEngineVer: engine1IsWhite ? engine2 : engine1, measure: measure });
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
		runSimulation(numGamesInput, measure, measure ? 0 : thinkTime);
		setCurrentlyRunning(true);
	}
	const handleClear = () => {
		workerRefs.current.forEach((w) => w.terminate());
		workerRefs.current = [];

		setStats({
			completed: 0,
			whiteWins: 0,
			blackWins: 0,
			stales: 0,
			draws: 0,
			engine1Wins: 0,
			engine2Wins: 0,
			totalEngine1Think: 0,
			totalEngine2Think: 0
		});

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cellSize]);

	const avgMovesMadeTillEnd =
		stats.completed === 0 || (measuring && currentlyRunning)
			? "--"
			: (
				(
					gameStates.reduce((accum, state) => {
						if (state.gameState !== GameState.Running) {
							return accum + state.movesMade;
						}
						return accum;
					}, 0) / stats.completed
				).toFixed(2)
			);

	const avgThinkTimeE1 = !measuring || currentlyRunning || games === 0
		? "--"
		: (stats.totalEngine1Think / games).toFixed(4);

	const avgThinkTimeE2 = !measuring || currentlyRunning || games === 0
		? "--"
		: (stats.totalEngine2Think / games).toFixed(4);

	const [startSimTime, setStartSimTime] = useState(0);
	const [endSimTime, setEndSimTime] = useState(0);


	return (
		<div className="w-screen h-screen overflow-y-hidden flex flex-row justify-between px-8">
			<div className="py-24 font-sans text-white">
				<h1 className="text-4xl font-mono font-bold mb-5 text-white">Match Manager</h1>
				<div className="flex flex-row gap-2 mb-5">
					<button className="bg-green-500 px-5 py-2 text-black font-bold" onClick={() => handleRun()} disabled={currentlyRunning || numGamesInput <= 0 || isNaN(numGamesInput) || numGamesInput > MAX_VISIBLE_GAMES}>Run</button>
					<button className="bg-indigo-500 px-5 py-2 text-white font-bold" onClick={() => handleRun(true)} disabled={currentlyRunning || numGamesInput <= 0 || isNaN(numGamesInput)}>Run & Measure</button>
					<button className="bg-red-500 px-5 py-2 text-white font-bold" onClick={() => {
						handleClear();
						setCurrentlyRunning(false);
						setStartSimTime(0);
						setEndSimTime(0);
						setMeasuring(false);
					}} disabled={workerRefs.current.length === 0}>Clear</button>
				</div>

				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Games:</label>
					<input
						className="font-mono border border-white text-white px-1"
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

							num = Math.min(Math.max(num, 1), MAX_GAMES);
							setNumGamesInput(num);
						}}
					/>
				</div>

				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Engine 1:</label>
					<select
						className="font-mono border border-white text-white"
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
				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Engine 2:</label>
					<select
						className="font-mono border border-white text-white"
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

				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Cell size:</label>
					<select
						className="font-mono border border-white text-white"
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
				<div className="flex flex-row gap-2 items-center mb-5">
					<label className="font-bold">Think time:</label>
					<input
						className="font-mono border border-white text-white px-1"
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

				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Completed:</label>
					<ProgressBar
						segments={[
							{
								value: games === 0 ? 0 : (stats.completed / games) * 100,
								color: "#00ff00",
								label: stats.completed,
								labelColor: "#000",
							},
						]}
						color="#00ff00"
						background="#ff0000"
						width={200}
						height={20}
					/>
				</div>

				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Wins:</label>
					<div className="flex flex-col gap-2">
						<ProgressBar
							segments={[
								{ value: games === 0 ? 0 : (stats.whiteWins / games) * 100, color: "#ffffff", label: stats.whiteWins, labelColor: "#000" },
								{ value: games === 0 ? 0 : (stats.blackWins / games) * 100, color: "#000000", label: stats.blackWins, labelColor: "#fff" },
								{ value: games === 0 ? 0 : (stats.stales / games) * 100, color: "#ffaa00", label: stats.stales, labelColor: "#000" },
								{ value: games === 0 ? 0 : (stats.draws / games) * 100, color: "#595959", label: stats.draws, labelColor: "#fff" },
							]}
							background="red"
							width={300}
							height={20}
						/>
					</div>
				</div>

				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Engine wins:</label>
					<div className="flex flex-col gap-2">
						<ProgressBar
							segments={[
								{ value: stats.engine1Wins+stats.engine2Wins === 0 ? 0 : ((stats.engine1Wins / (stats.engine1Wins+stats.engine2Wins)) * 100), color: "#ff8d3c", label: `E1 (v${engine1}) ` + stats.engine1Wins, labelColor: "#000" },
								{ value: stats.engine1Wins+stats.engine2Wins === 0 ? 0 : ((stats.engine2Wins / (stats.engine1Wins+stats.engine2Wins)) * 100), color: "#d2ff0c", label: `E2 (v${engine2}) ` + stats.engine2Wins, labelColor: "#000" },
							]}
							background="red"
							width={300}
							height={20}
						/>
					</div>
				</div>

				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Engine 1 (v{engine1}) wins:</label>
					<div className="flex flex-col gap-2">
						{stats.engine1Wins} ({stats.engine1Wins+stats.engine2Wins === 0 ? "--" : ((stats.engine1Wins / (stats.engine1Wins+stats.engine2Wins))*100).toFixed(4)}%)
					</div>
				</div>

				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Engine 2 (v{engine2}) wins:</label>
					<div className="flex flex-col gap-2">
						{stats.engine2Wins} ({stats.engine1Wins+stats.engine2Wins === 0 ? "--" : ((stats.engine2Wins / (stats.engine1Wins+stats.engine2Wins))*100).toFixed(4)}%)
					</div>
				</div>

				<h2 className="text-2xl font-mono font-bold mb-3 mt-10">Fun stats</h2>

				<div className="flex flex-row gap-2 items-center mb-2">
					<label className="font-bold">Average moves made:</label>
					<p>{avgMovesMadeTillEnd}</p>
				</div>

				{
					measuring && (
						<>
							<h2 className="text-2xl font-mono font-bold mb-3 mt-5">Times</h2>

							<div className="flex flex-row gap-2 items-center mb-2">
								<label className="font-bold">Total simulation time:</label>
								<p>{(!currentlyRunning ? ((endSimTime - startSimTime)/1000).toFixed(4) : "--")} s</p>
							</div>

							<div className="flex flex-row gap-2 items-center mb-2">
								<label className="font-bold">Engine 1 thinking time:</label>
								<p>{avgThinkTimeE1} ms</p>
							</div>

							<div className="flex flex-row gap-2 items-center mb-2">
								<label className="font-bold">Engine 2 thinking time:</label>
								<p>{avgThinkTimeE2} ms</p>
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
														gameStates[idx] && gameStates[idx].gameState !== GameState.Running ? (
															<div
																className="flex flex-row justify-center w-full font-sans text-sm font-bold"
																style={{
																	color: gameStates[idx].winner === Color.White ? "#000" : gameStates[idx].winner === Color.Black ? "#fff" : gameStates[idx].gameState === GameState.Stalemate ? "#000" : "#fff",
																	background: gameStates[idx].winner === Color.White ? "#fff" : gameStates[idx].winner === Color.Black ? "#000" : gameStates[idx].gameState === GameState.Stalemate ? "#ffaa00" : "#595959",
																}}
															>
																{
																	gameStates[idx].gameState === GameState.Stalemate ? "Stalemate" : gameStates[idx].gameState === GameState.Draw ? "Draw" : (
																		<p className="px-1">{gameStates[idx].winner === Color.White ? "White" : "Black"} (v{gameStates[idx].engines![gameStates[idx].winner === Color.White ? "W" : "B"]}) win</p>
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
