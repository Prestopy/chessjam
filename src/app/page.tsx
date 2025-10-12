"use client";
import {useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import {allEngines, EngineDetail, EngineVersion, GameDetails, getEngineDetail, standardChessSetup} from "@/app/utils";
import {Move} from "@/app/Move";
import {Color} from "@/app/utils";
import {Engine} from "@/app/engines/Engine";

export default function Home() {
	const chessGame = useRef(new Chess(8, 8).generateBoard(standardChessSetup));
	const engine = useRef<Engine | null>(null);
	const [engineVer, setEngineVer] = useState<EngineVersion | null>(null);
	const [engineColor, setEngineColor] = useState<Color | null>("B");

	const handleSetEngine = (ver: EngineVersion | null) => {
		if (ver === null) {
			engine.current = null;
			setEngineVer(null);
			return;
		}

		const detail = getEngineDetail(ver);
		if (!detail) {
			alert("Invalid engine");
			return;
		}

		const eng = detail.getEngine().connectTo(chessGame.current);
		if (engineColor) eng.setColor(engineColor);

		engine.current = eng;
		setEngineVer(ver);
	}

	const [chessPosition, setChessPosition] = useState(chessGame.current.getBoard());
	const [currentTurn, setCurrentTurn] = useState<"W" | "B">("W");
	const [gameState, setGameState] = useState<GameDetails>({
		state: "running",
		winner: null
	});

	const captureSfx = useRef<HTMLAudioElement | null>(null);
	const moveSfx = useRef<HTMLAudioElement | null>(null);
	const castleSfx = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		// only runs in browser
		captureSfx.current = new Audio("/sfx/capture.mp3");
		moveSfx.current = new Audio("/sfx/move.mp3");
		castleSfx.current = new Audio("/sfx/castle.mp3");
	}, []);

	const handleMove = (move: Move) => {
		const success = chessGame.current.move(move);
		if (success.ok) {
			playMoveSound(success.enrichedMove);

			chessGame.current.nextTurn();
			setCurrentTurn(chessGame.current.getTurn());
			setChessPosition(chessGame.current.getBoard());
			setGameState(chessGame.current.getGameDetails());
		}
	}

	const playMoveSound = (move: Move) => {
		if (move.isCaptureMove()) captureSfx.current?.play();
		else if (move.isCastleMove()) castleSfx.current?.play();
		else moveSfx.current?.play();
	}

	useEffect(() => {
		if (chessGame.current.getTurn() === engineColor && gameState.state === "running" && engine.current) {
			setTimeout(() => {
				const eng = engine.current;
				if (!eng) return; // TS now knows eng is not null below

				const move = eng.pickMove();
				if (!move) {
					alert("Error - no moves found yet game is not over");
					return; // prevents TS warning
				}

				chessGame.current.makeMove(move);
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
		<div className="min-w-screen min-h-screen flex flex-col items-center justify-center">
			<h1 className="text-4xl font-mono font-bold mb-5">
				{gameState.state === "running" ? ((currentTurn === "W" ? "WHITE" : "BLACK") + " to move") : gameState.state.toUpperCase()}
				{gameState.state === "checkmate" ? <span className="font-normal font-small text-gray-400"> in {chessGame.current.getHistory().length} moves</span> : null}
			</h1>

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
					squareDim={80}
					chessboard={chessPosition}
					onMove={handleMove}
					getHighlights={(r: number, c: number) => chessGame.current.getTurn() !== chessGame.current.getSquare(r, c)?.color ? [] : chessGame.current.generateMoves(r, c, true).map(m => ({row: m.toRow, col: m.toCol}))}

					disable={gameState.state !== "running"}
				/>
			</div>

			<div className="flex flex-row gap-2 items-center mt-10">
				<label className="font-bold">Engine:</label>
				<select
					className="font-mono border border-white"
					value={engineVer ?? "--"}
					onChange={(e) => handleSetEngine(e.target.value as EngineVersion)}
				>
					<option key={-1} value="--">None</option>
					{
						allEngines.map((details, i) => (
							<option key={i} value={details.version}>v{details.version} - {details.name}</option>
						))
					}
				</select>
			</div>
		</div>
	);
}
