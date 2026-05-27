"use client";
import {useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import {pieceColor} from "@/app/utils/utils";
import {Engine} from "@/app/engines/Engine";
import {isCaptureMove, isCastleMove, moveFromCol, moveFromRow, moveToCol, moveToRow} from "@/app/Move";
import {Color, EngineDiagnostics, GameDetails, GameState, Move} from "@/app/utils/types";
import {allEngines, EngineVersion, getEngineDetail} from "@/app/engines/engineDetails";

export default function Home() {
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

	const getHighlightsForSquare = (r: number, c: number) => {
		const NORMAL = "rgba(255,244,0,0.25)";
		const CAPTURE = "rgba(181,0,0,0.75)";

		const game = chessGame.current;
		const piece = game.getSquare(r, c);
		if (piece === null || game.getTurn() !== pieceColor(piece)) return [];

		return game.generateMoves(r, c, true).map(m => ({
			row: moveToRow(m),
			col: moveToCol(m),
			color: isCaptureMove(m) ? CAPTURE : NORMAL
		}));
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

	const pointCounterWidth = 500;

	return (
		<div className="min-w-screen min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-6">
			<h1 className="text-4xl font-mono font-bold mb-5">
				{gameState.state === GameState.Running ? ((currentTurn === Color.White ? "WHITE" : "BLACK") + " to move") : (
					gameState.state === GameState.Checkmate ? "CHECKMATE" :
						gameState.state === GameState.Stalemate ? "STALEMATE" : "DRAW"
				)}
			</h1>

			<div className="flex flex-row items-center justify-center gap-4 mb-6">
				<div style={{ width: pointCounterWidth, height: 12, background: "#000000" }} className="rounded overflow-hidden border border-zinc-700">
					<div style={{ width: pointCounterWidth/(chessGame.current.countPoints(Color.White)+chessGame.current.countPoints(Color.Black))*chessGame.current.countPoints(Color.White), height: "100%", background: "#ffffff" }} />
				</div>
			</div>

			{/* Main Layout Container */}
			<div className="flex flex-row justify-center items-stretch gap-10 max-w-6xl w-full">

				{/* Left Area: Board Display */}
				<div className="flex flex-col items-center justify-center">
					<div
						className="w-full h-8 flex flex-row justify-center items-center font-mono font-bold mb-2 rounded"
						style={{
							color: gameState.winner === Color.White ? "#000" : "#fff",
							background: gameState.winner === Color.White ? "#fff" : gameState.winner === Color.Black ? "#000" : "#ffaa00",
							visibility: gameState.state === GameState.Running ? "hidden" : "visible",
						}}
					>
						{gameState.state !== GameState.Running && <p>{gameState.winner === Color.White ? "White" : "Black"} wins</p>}
					</div>

					<ChessboardDisplay
						squareDim={75}
						flip
						chessboard={chessPosition}
						onMove={handleMove}
						getHighlights={getHighlightsForSquare}
						disable={gameState.state !== GameState.Running}
					/>
				</div>

				{/* Right Area: Telemetry Diagnostics Panel */}
				{engineVer !== null && (
					<div className="w-80 bg-zinc-800 border-2 border-zinc-700 rounded-lg p-5 flex flex-col justify-between shadow-xl font-mono">
						<div>
							<h2 className="text-xl font-bold border-b border-zinc-700 pb-2 mb-4 text-emerald-400 flex items-center gap-2">
								Live Diagnostics
							</h2>

							{diagnostics ? (
								<div className="space-y-4 text-sm">
									<div>
										<span className="block text-xs uppercase tracking-wider text-zinc-400">Current Eval</span>
										<span className={`text-2xl font-bold ${diagnostics.currentEval >= 0 ? 'text-white' : 'text-zinc-400'}`}>
                                         {diagnostics.currentEval > 0 ? `+${diagnostics.currentEval}` : diagnostics.currentEval}
                                     </span>
									</div>
									<div className="grid grid-cols-2 gap-4 border-t border-zinc-700/50 pt-3">
										<div>
											<span className="block text-xs uppercase tracking-wider text-zinc-400">Depth</span>
											<span className="text-lg font-bold text-zinc-200">{diagnostics.depthReached} plies</span>
										</div>
										<div>
											<span className="block text-xs uppercase tracking-wider text-zinc-400">Speed</span>
											<span className="text-lg font-bold text-zinc-200">
                                             {diagnostics.timeElapsedMs > 0 ? Math.round((diagnostics.nodesVisited / diagnostics.timeElapsedMs) * 1000) : 0} n/s
                                         </span>
										</div>
									</div>
									<div className="border-t border-zinc-700/50 pt-3">
										<span className="block text-xs uppercase tracking-wider text-zinc-400">Nodes Explored</span>
										<span className="text-base text-zinc-300 font-bold">{diagnostics.nodesVisited.toLocaleString()}</span>
									</div>
									{diagnostics.bestMove && (
										<div className="border-t border-zinc-700/50 pt-3">
											<span className="block text-xs uppercase tracking-wider text-zinc-400">Pondering Line</span>
											<span className="inline-block bg-zinc-900 px-2 py-1 rounded text-emerald-300 font-bold mt-1">{diagnostics.bestMove}</span>
										</div>
									)}
								</div>
							) : (
								<p className="text-zinc-500 italic text-sm text-center py-10">Waiting for engine to calculate...</p>
							)}
						</div>

						<div className="text-xs text-zinc-500 text-center border-t border-zinc-700/50 pt-3 mt-4">
							Engine Active: v{engineVer}
						</div>
					</div>
				)}
			</div>

			<div className="flex flex-row gap-2 items-center mt-8">
				<label className="font-bold font-mono text-sm">Opponent:</label>
				<select
					className="font-mono bg-zinc-800 text-white border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
					value={engineVer ?? "--"}
					onChange={(e) => {
						if (e.target.value === "--") handleSetEngine(null);
						else handleSetEngine(e.target.value as EngineVersion | null);
					}}
				>
					<option key={-1} value="--">Human</option>
					{allEngines.map((details, i) => (
						<option key={i} value={details.version}>v{details.version} - {details.name}</option>
					))}
				</select>
			</div>
		</div>
	);
}
