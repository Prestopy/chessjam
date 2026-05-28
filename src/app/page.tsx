"use client";
import {Fragment, useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import {pieceColor} from "@/app/utils/utils";
import {Engine} from "@/app/engines/Engine";
import {isCaptureMove, isCastleMove, moveFromCol, moveFromRow, moveToCol, moveToRow} from "@/app/Move";
import {Color, EngineDiagnostics, GameDetails, GameState, Move, SquareHighlight} from "@/app/utils/types";
import {allEngines, EngineVersion, getEngineDetail} from "@/app/engines/engineDetails";

export default function Home() {
	const [gameStarted, setGameStarted] = useState(false);
	const begin = () => {
		setGameStarted(true);
	}

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

	const getHighlightsForSquare = (sq?: number): SquareHighlight[] => {
		const WHITE = "rgba(191,191,191,0.75)";
		const LAST_MOVE = "rgba(255,244,0,0.25)";
		const CAPTURE = "rgba(181,0,0,0.75)";

		const highlights: SquareHighlight[] = [];

		// Move for sq if provided
		if (sq) {
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

	return (
		<div className="min-w-screen min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-6">
			<h1 className="text-4xl font-mono font-bold mb-5">
				{gameState.state === GameState.Running ? ((currentTurn === Color.White ? "WHITE" : "BLACK") + " to move") : (
					gameState.state === GameState.Checkmate ? "CHECKMATE" :
						gameState.state === GameState.Stalemate ? "STALEMATE" : "DRAW"
				)}
			</h1>

			{/* Main Layout Container */}
			<div className="flex flex-row justify-center items-stretch gap-10 max-w-6xl w-full">


				{/* Left Area: Board Display */}
				<div>
					<div style={{ width: 12, height: "100%", background: "#ffffff" }} className="rounded overflow-hidden border border-zinc-700">
						<div style={{ width: "100%", height: `${(chessGame.current.countPoints(Color.Black)/(chessGame.current.countPoints(Color.Black)+chessGame.current.countPoints(Color.White)))*100}%`, background: "#000000" }} />
					</div>
				</div>

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
						squareDim={85}
						flip
						chessboard={chessPosition}
						onMove={handleMove}
						getHighlights={getHighlightsForSquare}
						disable={!gameStarted || gameState.state !== GameState.Running}
					/>
				</div>

				{/* Right Area: Info stiiiff */}
				{
					gameStarted ? (
							<div className="w-96">
								<div className="flex flex-row gap-2 items-center mt-8">

								</div>
							</div>
						) : (
							<div className="w-96 border-white border p-4 flex flex-col gap-4">
								<div>
									<label className="font-bold font-mono text-sm pr-2">Opponent:</label>
									<select
										className="font-mono bg-zinc-800 text-white border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500 w-32"
										value={engineVer ?? "--"}
										onChange={(e) => {
											if (e.target.value.startsWith("--")) handleSetEngine(null);
											else handleSetEngine(e.target.value as EngineVersion | null);
										}}
									>
										<option value="--">Human</option>
										<optgroup label="ENGINES">
											{allEngines.map((details, i) => (
												<Fragment key={i}>
													<option value={details.version}>v{details.version}</option>
													<option value="##" disabled>{details.name}</option>
												</Fragment>
											))}
										</optgroup>
									</select>
								</div>

								<button onClick={begin} className="px-8 py-2 bg-emerald-500 rounded-lg">
									Start game
								</button>
							</div>
						)
				}
			</div>
		</div>
	);
}
