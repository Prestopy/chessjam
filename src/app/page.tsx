"use client";
import {Fragment, useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import {pieceColor, swapColor} from "@/app/utils/utils";
import {Engine} from "@/app/engines/Engine";
import {isCaptureMove, isCastleMove, isEnPassantMove, moveFromCol, moveFromRow, moveToCol, moveToRow} from "@/app/Move";
import {
	Color,
	EngineDiagnostics,
	GameDetails,
	GameState,
	Move,
	SquareHighlight,
	PieceName,
	STRING_PIECE_NAMES
} from "@/app/utils/types";
import {allEngines, EngineVersion, getEngineDetail} from "@/app/engines/engineDetails";
import {FullStrategy, Generator} from "@/app/generator/Generator";
import RuleInspector from "@/app/Components/RuleInspector";

type RuleType = "standard" | "randomized";

export default function Home() {
	const [gameStarted, setGameStarted] = useState(false);
	const [setupStage, setSetupStage] = useState<1 | 2 | 3>(1);
	const [ruleType, setRuleType] = useState<RuleType>("standard");

	const chessGame = useRef(new Chess(8, 8));
	const engine = useRef<Engine | null>(null);
	const [engineVer, setEngineVer] = useState<EngineVersion | null>(null);
	const [engineColor, setEngineColor] = useState<Color | null>(Color.Black);

	const [diagnostics, setDiagnostics] = useState<EngineDiagnostics | null>(null);

	// Initialize state with standard base generator rules
	const [activeGenerator, setActiveGenerator] = useState<Generator>(() => Generator.standardRules());

	// Regenerate rules dynamically when the rule selector drops or changes
	const handleRuleTypeChange = (type: RuleType) => {
		setRuleType(type);
		let gen: Generator;
		if (type === "standard") {
			gen = Generator.standardRules();
		} else {
			gen = Generator.mutatedStandardRules({
				sameMoveAndCaptureGeometryChance: 0.4,
				modifierChance: 0.3,
				multiGeometryChance: 0.2,
				multiModifierChance: 0.1
			});
		}
		chessGame.current.setGenerator(gen);
		setActiveGenerator(gen);
	};

	const begin = () => {
		setGameStarted(true);
	};

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

		eng.setDiagnosticsListener((data) => {
			setDiagnostics(data);
		});

		engine.current = eng;
		setEngineVer(ver);
	};

	const handleSetPlayerColor = (playerColor: Color) => {
		const targetEngineColor = swapColor(playerColor);
		setEngineColor(targetEngineColor);
		if (engine.current) {
			engine.current.setColor(targetEngineColor);
		}
	};

	const [chessPosition, setChessPosition] = useState(chessGame.current.getBoard());
	const [currentTurn, setCurrentTurn] = useState<Color>(Color.White);
	const [gameState, setGameState] = useState<GameDetails>({state: GameState.Running, winner: null});

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

		if (sq !== undefined) {
			const game = chessGame.current;
			const piece = game.getSquare(sq >> 3, sq & 7);
			if (piece === null || game.getTurn() !== pieceColor(piece)) return [];

			const moves = game.generateMoves(sq >> 3, sq & 7, true);
			highlights.push(...moves.map(m => ({
				row: moveToRow(m),
				col: moveToCol(m),
				color: isCaptureMove(m) || isEnPassantMove(m) ? CAPTURE : WHITE,
				type: isCaptureMove(m) || isEnPassantMove(m) ? "highlight" as const : "dot" as const,
			})));
		}

		const moveHistory = chessGame.current.getHistory();
		if (moveHistory.length > 0) {
			const lastMove = moveHistory[moveHistory.length - 1].move;
			highlights.push(
				{row: moveFromRow(lastMove), col: moveFromCol(lastMove), color: LAST_MOVE, type: "highlight"},
				{row: moveToRow(lastMove), col: moveToCol(lastMove), color: LAST_MOVE, type: "highlight"},
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
		if (gameStarted && chessGame.current.getTurn() === engineColor && gameState.state === GameState.Running && engine.current) {
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
		}
	}, [currentTurn, engineVer, engineColor, gameStarted]);

	const handleNextStep = () => {
		if (setupStage === 1 && engineVer === null) {
			setSetupStage(3);
		} else {
			setSetupStage((prev) => (prev + 1) as 1 | 2 | 3);
		}
	};

	const handleBackStep = () => {
		if (setupStage === 3 && engineVer === null) {
			setSetupStage(1);
		} else {
			setSetupStage((prev) => (prev - 1) as 1 | 2 | 3);
		}
	};

	// Safely reads strategies mapped inside the active Generator context
	const registeredStrategies = activeGenerator.getStrategies();

	return (
		<div
			className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 font-sans overflow-hidden">
			<h1 className="text-4xl font-mono font-bold mb-8 tracking-wider text-zinc-100 shrink-0">
				{gameState.state === GameState.Running ? ((currentTurn === Color.White ? "WHITE" : "BLACK") + " TO MOVE") : (
					gameState.state === GameState.Checkmate ? "CHECKMATE" :
						gameState.state === GameState.Stalemate ? "STALEMATE" : "DRAW"
				)}
			</h1>

			{/* CRITICAL: Added max-h-[780px] and min-h-0 so row items lock to the chessboard viewport frame */}
			<div className="flex flex-row justify-center items-stretch gap-10 max-w-6xl w-full max-h-[780px] min-h-0 flex-1">
				{/* Left Area: Evaluation Bar */}
				<div className="flex shrink-0">
					<div style={{width: 14, height: "100%", background: "#ffffff"}}
					     className="rounded-full overflow-hidden border border-zinc-800 shadow-inner">
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

				<div className="flex flex-col items-center justify-center shrink-0">
					<div
						className="w-full h-8 flex flex-row justify-center items-center font-mono font-bold mb-3 rounded shadow"
						style={{
							color: gameState.winner === Color.White ? "#000" : "#fff",
							background: gameState.winner === Color.White ? "#fff" : gameState.winner === Color.Black ? "#000" : "#ffaa00",
							visibility: gameState.state === GameState.Running ? "hidden" : "visible",
						}}
					>
						{gameState.state !== GameState.Running &&
                            <p>{gameState.winner === Color.White ? "White" : "Black"} wins</p>}
					</div>
					<div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
						<ChessboardDisplay
							squareDim={85}
							flip={engineColor === Color.Black}
							chessboard={chessPosition}
							onMove={handleMove}
							getHighlights={getHighlightsForSquare}
							disable={!gameStarted || gameState.state !== GameState.Running}
						/>
					</div>
				</div>

				{/* Right Area: Sidebar Control Tower */}
				{/* CRITICAL: Added max-h-full, min-h-0, and overflow-hidden here */}
				<div
					className="min-w-[30rem] max-w-[30rem] max-h-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-5 justify-between min-h-0 overflow-y-auto">
					{gameStarted ? (
						/* CRITICAL: Changed from h-full to flex-1 and min-h-0 to lock heights */
						<div className="flex flex-col gap-4 flex-1 min-h-0 justify-between">
							<div className="space-y-4 shrink-0">
								<h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 font-bold">Match Details</h2>
								<div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2">
									<div className="text-sm text-zinc-400">Mode: <span
										className="text-white font-mono">{engineVer ? `Engine v${engineVer}` : "Human local"}</span>
									</div>
									{!engineVer && <div className="text-sm text-zinc-400">Match type: <span
                                        className="text-white font-mono">Pass & Play</span></div>}
									{engineVer && <div className="text-sm text-zinc-400">Your Color: <span
                                        className="text-white font-mono">{engineColor === Color.Black ? "White" : "Black"}</span>
                                    </div>}
									<div className="text-sm text-zinc-400">Rules: <span
										className="text-emerald-400 font-mono uppercase text-xs font-bold">{ruleType}</span>
									</div>
								</div>
							</div>

							{/* RuleInspector will now naturally take the remaining height space and overflow internally */}
							<div className="flex-1 min-h-0">
								<RuleInspector
									registeredStrategies={registeredStrategies}
									highlightDifferences
								/>
							</div>
						</div>
					) : (
						/* CRITICAL: Ensured proper flex constraints on setup views */
						<div className="flex flex-col flex-1 min-h-0 justify-between">
							<div className="flex flex-col flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">

								{setupStage === 1 && (
									<div className="space-y-4 animate-fadeIn shrink-0">
										<h3 className="text-lg font-mono font-bold text-zinc-100">Select Opponent</h3>
										<p className="text-xs text-zinc-400 leading-relaxed">Choose to battle a friend
											locally or challenge built-in automated engines.</p>
										<div className="flex flex-col gap-2 pt-2">
											<label
												className="font-mono text-xs text-zinc-500 uppercase tracking-wider font-bold">Target
												Enemy</label>
											<select
												className="font-mono bg-zinc-950 text-white border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 w-full transition"
												value={engineVer ?? "--"}
												onChange={(e) => {
													if (e.target.value.startsWith("--")) handleSetEngine(null);
													else handleSetEngine(e.target.value as EngineVersion | null);
												}}
											>
												<option value="--">⚔️ Human (Pass & Play)</option>
												<optgroup label="🤖 AUTOMATED ENGINES"
												          className="bg-zinc-900 text-zinc-400">
													{allEngines.map((details, i) => (
														<Fragment key={i}>
															<option value={details.version}
															        className="text-white">v{details.version} — {details.name}</option>
														</Fragment>
													))}
												</optgroup>
											</select>
										</div>
									</div>
								)}

								{setupStage === 2 && (
									<div className="space-y-4 animate-fadeIn shrink-0">
										<h3 className="text-lg font-mono font-bold text-zinc-100">Choose Your Side</h3>
										<p className="text-xs text-zinc-400 leading-relaxed">Select which color army you
											want to lead into battle. White moves first.</p>

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
									<div className="flex flex-col flex-1 min-h-0 space-y-4">
										<div className="shrink-0">
											<h3 className="text-xl font-mono font-bold text-zinc-100">Rules & Setup</h3>
											<p className="text-sm text-zinc-400 leading-relaxed mt-1">
												Customize localized pieces modifications and dynamic rule logic overrides.
											</p>
										</div>

										{/* Action Rules Type Selector */}
										<div
											className="grid grid-cols-2 gap-2 bg-zinc-950 p-2 border border-zinc-800 rounded-xl w-full table-layout-fixed shrink-0">
											<button
												type="button"
												onClick={() => handleRuleTypeChange("standard")}
												className={`py-3 text-sm font-mono rounded-lg font-bold uppercase tracking-wider transition-all border ${
													ruleType === "standard"
														? "bg-zinc-800 border-zinc-700 text-white shadow"
														: "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200"
												}`}
											>
												Standard
											</button>
											<button
												type="button"
												onClick={() => handleRuleTypeChange("randomized")}
												className={`py-3 text-sm font-mono rounded-lg font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
													ruleType === "randomized"
														? "bg-purple-950/50 border border-purple-700 text-purple-200 shadow"
														: "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200"
												}`}
											>
												<span>🎲</span>
												<span className="truncate">Chaos Rules</span>
											</button>
										</div>

										<div className="flex-1 min-h-0">
											<RuleInspector
												registeredStrategies={registeredStrategies}
												highlightDifferences
											/>
										</div>
									</div>
								)}
							</div>

							{/* Step Navigation Deck */}
							<div className="flex gap-2 border-t border-zinc-800 pt-4 mt-4 shrink-0">
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
										className={`flex-1 py-2.5 rounded-lg font-mono text-sm font-bold tracking-wider shadow-lg active:scale-[0.99] transition-all ${
											ruleType === "randomized"
												? "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/20"
												: "bg-emerald-400 hover:bg-emerald-500 text-zinc-950 shadow-emerald-500/20"
										}`}
									>
										Start Game
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
