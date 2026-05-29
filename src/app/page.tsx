"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import { Chess } from "@/app/Chess";
import { pieceColor } from "@/app/utils/utils";
import { Engine } from "@/app/engines/Engine";
import { isCaptureMove, isCastleMove, moveFromCol, moveFromRow, moveToCol, moveToRow } from "@/app/Move";
import { Color, EngineDiagnostics, GameDetails, GameState, Move, SquareHighlight } from "@/app/utils/types";
import { allEngines, EngineVersion, getEngineDetail } from "@/app/engines/engineDetails";

export default function Home() {
	const [gameStarted, setGameStarted] = useState(false);
	const [setupStage, setSetupStage] = useState<1 | 2 | 3>(1);

	const begin = () => {
		setGameStarted(true);
	};

	const chessGame = useRef(new Chess(8, 8));
	const engine = useRef<Engine | null>(null);
	const [engineVer, setEngineVer] = useState<EngineVersion | null>(null);
	const [engineColor, setEngineColor] = useState<Color | null>(Color.Black);

	// State to catch diagnostic telemetry frames
	const [diagnostics, setDiagnostics] = useState<EngineDiagnostics | null>(null);

	const handleSetEngine = (ver: EngineVersion | null) => {
		if (ver === null) {
			engine.current = null;
			setEngineVer(null);
			setDiagnostics(null);
			return;
		}

		const detail = getEngineDetail(ver);
		if (!detail) {
			alert("Invalid engine");
			return;
		}

		const eng = detail.getEngine().connectTo(chessGame.current);
		if (engineColor) eng.setColor(engineColor);

		// Wire engine up to write direct updates into our state hook
		eng.setDiagnosticsListener((data) => {
			setDiagnostics(data);
		});

		engine.current = eng;
		setEngineVer(ver);
	};

	// Dynamically synchronize engine configurations if player changes color selection
	const handleSetPlayerColor = (playerColor: Color) => {
		const targetEngineColor = playerColor === Color.White ? Color.Black : Color.White;
		setEngineColor(targetEngineColor);
		if (engine.current) {
			engine.current.setColor(targetEngineColor);
		}
	};

	const [chessPosition, setChessPosition] = useState(chessGame.current.getBoard());
	const [currentTurn, setCurrentTurn] = useState<Color>(Color.White);
	const [gameState, setGameState] = useState<GameDetails>({ state: GameState.Running, winner: null });

	const captureSfx = useRef<HTMLAudioElement | null>(null);
	const moveSfx = useRef<HTMLAudioElement | null>(null);
	const castleSfx = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		captureSfx.current = new Audio("/sfx/capture.mp3");
		moveSfx.current = new Audio("/sfx/move.mp3");
		castleSfx.current = new Audio("/sfx/castle.mp3");
	}, []);

	const handleMove = (move: Move) => {
		const pieceMoved = chessGame.current.getSquare(moveFromRow(move), moveFromCol(move));
		if (pieceMoved === null) return;

		const boardMove = chessGame.current.move(move);
		if (boardMove.ok) {
			playMoveSound(boardMove.enrichedMove);
			chessGame.current.nextTurn();
			setCurrentTurn(chessGame.current.getTurn());
			setChessPosition(chessGame.current.getBoard());
			setGameState(chessGame.current.getGameDetails());
		}
	};

	const getHighlightsForSquare = (sq?: number): SquareHighlight[] => {
		const WHITE = "rgba(191,191,191,0.75)";
		const LAST_MOVE = "rgba(255,244,0,0.25)";
		const CAPTURE = "rgba(181,0,0,0.75)";

		const highlights: SquareHighlight[] = [];

		// Move for sq if provided
		if (sq !== undefined) {
			const game = chessGame.current;
			const piece = game.getSquare(sq >> 3, sq & 7);
			if (piece === null || game.getTurn() !== pieceColor(piece)) return [];

			highlights.push(...game.generateMoves(sq >> 3, sq & 7, true).map(m => ({
				row: moveToRow(m),
				col: moveToCol(m),
				color: isCaptureMove(m) ? CAPTURE : WHITE,
				type: isCaptureMove(m) ? "highlight" as const : "dot" as const,
			})));
		}

		// Last move
		const moveHistory = chessGame.current.getHistory();
		if (moveHistory.length > 0) {
			const lastMove = moveHistory[moveHistory.length - 1].move;
			highlights.push(
				{ row: moveFromRow(lastMove), col: moveFromCol(lastMove), color: LAST_MOVE, type: "highlight" },
				{ row: moveToRow(lastMove), col: moveToCol(lastMove), color: LAST_MOVE, type: "highlight" },
			);
		}

		return highlights;
	};

	const playMoveSound = (move: Move) => {
		if (isCaptureMove(move)) captureSfx.current?.play();
		else if (isCastleMove(move)) castleSfx.current?.play();
		else moveSfx.current?.play();
	};

	useEffect(() => {
		if (chessGame.current.getTurn() === engineColor && gameState.state === GameState.Running && engine.current) {
			setTimeout(() => {
				const eng = engine.current;
				if (!eng) return;

				const move = eng.pickMove();
				if (!move) {
					alert("Error - no moves found yet game is not over");
					return;
				}

				chessGame.current.move(move);
				playMoveSound(move);
				chessGame.current.nextTurn();
				setCurrentTurn(chessGame.current.getTurn());
				setChessPosition(chessGame.current.getBoard());
				setGameState(chessGame.current.getGameDetails());
			}, 500);
		}
	}, [currentTurn, engineVer]);

	// Handle wizard step navigation with human-skipping rules
	const handleNextStep = () => {
		if (setupStage === 1 && engineVer === null) {
			setSetupStage(3); // Skip color selection if human
		} else {
			setSetupStage((prev) => (prev + 1) as 1 | 2 | 3);
		}
	};

	const handleBackStep = () => {
		if (setupStage === 3 && engineVer === null) {
			setSetupStage(1); // Return directly to stage 1 if human
		} else {
			setSetupStage((prev) => (prev - 1) as 1 | 2 | 3);
		}
	};

	return (
		<div className="min-w-screen min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 font-sans">
			<h1 className="text-4xl font-mono font-bold mb-8 tracking-wider text-zinc-100">
				{gameState.state === GameState.Running ? ((currentTurn === Color.White ? "WHITE" : "BLACK") + " TO MOVE") : (
					gameState.state === GameState.Checkmate ? "CHECKMATE" :
						gameState.state === GameState.Stalemate ? "STALEMATE" : "DRAW"
				)}
			</h1>

			{/* Main Layout Container */}
			<div className="flex flex-row justify-center items-stretch gap-10 max-w-6xl w-full">

				{/* Left Area: Board Display Evaluation bar */}
				<div className="flex">
					<div style={{ width: 14, height: "100%", background: "#ffffff" }} className="rounded-full overflow-hidden border border-zinc-800 shadow-inner">
						<div
							style={{
								width: "100%",
								height: `${(chessGame.current.countPoints(Color.Black) / (chessGame.current.countPoints(Color.Black) + chessGame.current.countPoints(Color.White) || 1)) * 100}%`,
								background: "#000000",
								transition: "height 0.3s ease"
							}}
						/>
					</div>
				</div>

				<div className="flex flex-col items-center justify-center">
					<div
						className="w-full h-8 flex flex-row justify-center items-center font-mono font-bold mb-3 rounded shadow"
						style={{
							color: gameState.winner === Color.White ? "#000" : "#fff",
							background: gameState.winner === Color.White ? "#fff" : gameState.winner === Color.Black ? "#000" : "#ffaa00",
							visibility: gameState.state === GameState.Running ? "hidden" : "visible",
						}}
					>
						{gameState.state !== GameState.Running && <p>{gameState.winner === Color.White ? "White" : "Black"} wins</p>}
					</div>
					<div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
						<ChessboardDisplay
							squareDim={85}
							flip
							chessboard={chessPosition}
							onMove={handleMove}
							getHighlights={getHighlightsForSquare}
							disable={!gameStarted || gameState.state !== GameState.Running}
						/>
					</div>
				</div>

				{/* Right Area: Sidebar Control Tower */}
				<div className="w-96 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-5 justify-between">
					{
						gameStarted ? (
							<div className="flex flex-col h-full justify-between">
								<div className="space-y-4">
									<h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 font-bold">Match Live</h2>
									<div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2">
										<div className="text-sm text-zinc-400">Mode: <span className="text-white font-mono">{engineVer ? `Engine v${engineVer}` : "Human local"}</span></div>
										{!engineVer && <div className="text-sm text-zinc-400">Match type: <span className="text-white font-mono">Pass & Play</span></div>}
										{engineVer && <div className="text-sm text-zinc-400">Your Color: <span className="text-white font-mono">{engineColor === Color.Black ? "White" : "Black"}</span></div>}
									</div>
								</div>
							</div>
						) : (
							<div className="flex flex-col h-full justify-between">
								<div>
									{/* Dynamic Stage Render Room */}
									<div className="min-h-[240px] pt-2">
										{setupStage === 1 && (
											<div className="space-y-4 animate-fadeIn">
												<h3 className="text-lg font-mono font-bold text-zinc-100">Select Opponent</h3>
												<p className="text-xs text-zinc-400 leading-relaxed">Choose to battle a friend locally or challenge built-in automated engines.</p>
												<div className="flex flex-col gap-2 pt-2">
													<label className="font-mono text-xs text-zinc-500 uppercase tracking-wider font-bold">Target Enemy</label>
													<select
														className="font-mono bg-zinc-950 text-white border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 w-full transition"
														value={engineVer ?? "--"}
														onChange={(e) => {
															if (e.target.value.startsWith("--")) handleSetEngine(null);
															else handleSetEngine(e.target.value as EngineVersion | null);
														}}
													>
														<option value="--">⚔️ Human (Pass & Play)</option>
														<optgroup label="🤖 AUTOMATED ENGINES" className="bg-zinc-900 text-zinc-400">
															{allEngines.map((details, i) => (
																<Fragment key={i}>
																	<option value={details.version} className="text-white">v{details.version} — {details.name}</option>
																</Fragment>
															))}
														</optgroup>
													</select>
												</div>
											</div>
										)}

										{setupStage === 2 && (
											<div className="space-y-4 animate-fadeIn">
												<h3 className="text-lg font-mono font-bold text-zinc-100">Choose Your Side</h3>
												<p className="text-xs text-zinc-400 leading-relaxed">Select which color army you want to lead into battle. White moves first.</p>

												<div className="grid grid-cols-2 gap-3 pt-4">
													<button
														type="button"
														onClick={() => handleSetPlayerColor(Color.White)}
														className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 font-mono transition-all duration-200 ${
															engineColor === Color.Black
																? "bg-white text-zinc-950 border-white font-bold shadow-xl scale-[1.02]"
																: "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
														}`}
													>
														<span className="text-2xl">♔</span>
														<span className="text-xs tracking-wider uppercase">White Pieces</span>
													</button>

													<button
														type="button"
														onClick={() => handleSetPlayerColor(Color.Black)}
														className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 font-mono transition-all duration-200 ${
															engineColor === Color.White
																? "bg-zinc-100 text-zinc-950 border-zinc-100 font-bold shadow-xl scale-[1.02]"
																: "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
														}`}
													>
														<span className="text-2xl text-zinc-600">♚</span>
														<span className="text-xs tracking-wider uppercase">Black Pieces</span>
													</button>
												</div>
											</div>
										)}

										{setupStage === 3 && (
											<div className="space-y-4 animate-fadeIn">
												<h3 className="text-lg font-mono font-bold text-zinc-100">Rules & Setup</h3>
												<p className="text-xs text-zinc-400 leading-relaxed">Customize localized pieces modifications, dynamic boards layouts, and alternate win metrics.</p>

												{/* Placeholder for future features */}
												<div className="border border-dashed border-zinc-800 bg-zinc-950/50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
													<span className="text-zinc-600 text-xs font-mono tracking-wide uppercase mb-1">Custom Variant Rules</span>
													<span className="text-[10px] text-zinc-500 max-w-[200px]">Randomization matrix, piece modifier vectors and alternative board logic to be implemented here.</span>
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Step Navigation Deck */}
								<div className="flex gap-2 border-t border-zinc-800 pt-4 mt-4">
									{setupStage > 1 && (
										<button
											onClick={handleBackStep}
											className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 font-mono text-sm hover:bg-zinc-800 transition"
										>
											Back
										</button>
									)}

									{setupStage < 3 ? (
										<button
											onClick={handleNextStep}
											className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono text-sm font-semibold transition"
										>
											Next Step
										</button>
									) : (
										<button
											onClick={begin}
											className="flex-1 py-2.5 bg-emerald-400 hover:bg-emerald-500 text-zinc-950 rounded-lg font-mono text-sm font-bold tracking-wider shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all"
										>
											Start
										</button>
									)}
								</div>
							</div>
						)
					}
				</div>
			</div>
		</div>
	);
}
