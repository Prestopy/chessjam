"use client";
import {useEffect, useRef, useState} from "react";
import ChessboardDisplay from "@/app/Components/ChessboardDisplay";
import {Chess} from "@/app/Chess";
import {pieceColor} from "@/app/utils/utils";
import {Engine} from "@/app/engines/Engine";
import {isCaptureMove, isCastleMove, moveFromCol, moveFromRow, moveToCol, moveToRow} from "@/app/Move";
import {Color, GameDetails, GameState, Move} from "@/app/utils/types";
import {allEngines, EngineVersion, getEngineDetail} from "@/app/engines/engineDetails";

export default function Home() {
	const chessGame = useRef(new Chess(8, 8));
	const engine = useRef<Engine | null>(null);
	const [engineVer, setEngineVer] = useState<EngineVersion | null>(null);
	const [engineColor, setEngineColor] = useState<Color | null>(Color.Black);

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
	const [currentTurn, setCurrentTurn] = useState<Color>(Color.White);
	const [gameState, setGameState] = useState<GameDetails>({
		state: GameState.Running,
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
	}

	const getHighlightsForSquare = (r: number, c: number) => {
		const game = chessGame.current;
		const piece = game.getSquare(r, c);

		if (piece === null) return [];
		if (game.getTurn() !== pieceColor(piece)) return [];

		return game.generateMoves(r, c, true)
			.map(m => ({ row: moveToRow(m), col: moveToCol(m) }));
	}

	const playMoveSound = (move: Move) => {
		if (isCaptureMove(move)) captureSfx.current?.play();
		else if (isCastleMove(move)) castleSfx.current?.play();
		else moveSfx.current?.play();
	}

	useEffect(() => {
		if (chessGame.current.getTurn() === engineColor && gameState.state === GameState.Running && engine.current) {
			setTimeout(() => {
				const eng = engine.current;
				if (!eng) return; // TS now knows eng is not null below

				const move = eng.pickMove();
				if (!move) {
					alert("Error - no moves found yet game is not over");
					return; // prevents TS warning
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
		<div className="min-w-screen min-h-screen flex flex-col items-center justify-center">
			<h1 className="text-4xl font-mono font-bold mb-5">
				{gameState.state === GameState.Running ? ((currentTurn === Color.White ? "WHITE" : "BLACK") + " to move") : (
					gameState.state === GameState.Checkmate ? "CHECKMATE" :
						gameState.state === GameState.Stalemate ? "STALEMATE" :
							"DRAW"
				)}
				{gameState.state === GameState.Checkmate ? <span className="font-normal font-small text-gray-400"> in {chessGame.current.getHistory().length} moves</span> : null}
			</h1>

			<div className="flex flex-row items-center justify-center gap-4 mb-10">
				<div style={{ width: pointCounterWidth, height: 25, background: "#000000" }}>
					<div style={{ width: pointCounterWidth/(chessGame.current.countPoints(Color.White)+chessGame.current.countPoints(Color.Black))*chessGame.current.countPoints(Color.White), height: "100%", background: "#ffffff" }} />
				</div>
			</div>

			<div className="flex flex-col justify-betwen">
				<div
					className="w-full h-8 flex flex-row justify-center items-center"
					style={{
						color: gameState.winner === Color.White ? "#000" : gameState.winner === Color.Black ? "#fff" : "#000",
						background: gameState.winner === Color.White ? "#fff" : gameState.winner === Color.Black ? "#000" : "#ffaa00",
						visibility: gameState.state === GameState.Running ? "hidden" : "visible",
					}}
				>
					{
						gameState.state === GameState.Running ? null : gameState.state === GameState.Stalemate || gameState.state === GameState.Draw ? "Stalemate/Draw" : (
							<p>{gameState.winner === Color.White ? "White" : "Black"} win</p>
						)
					}
				</div>
				<div className="flex flex-row justify-center gap-10">
					<ChessboardDisplay
						squareDim={80}
						chessboard={chessPosition}
						onMove={handleMove}
						getHighlights={getHighlightsForSquare}

						disable={gameState.state !== GameState.Running}
					/>

					{/*<div className="flex flex-row">*/}
					{/*	{*/}
					{/*		chessGame.current.getHistory().length > 0 ? (*/}
					{/*			<div className="flex flex-col gap-1 max-h-[640px] w-32 border-white border-2 overflow-y-auto">*/}
					{/*				{chessGame.current.getHistory().map((entry, i) => (*/}
					{/*					<div key={i} className="flex flex-row gap-1 items-center">*/}
					{/*						<span>{Math.floor(i/2)+1}. </span>*/}
					{/*						<img src={pieceSymbols[pieceName(entry.piece)][pieceColor(entry.piece)]} alt={`${pieceColor(entry.piece)} ${pieceName(entry.piece)}`} className="w-4 h-4" />*/}
					{/*						<span>{moveToNotation(entry.move)}</span>*/}
					{/*					</div>*/}
					{/*				))}*/}
					{/*			</div>*/}
					{/*		) : (*/}
					{/*			<p className="text-gray-400 italic">No moves made yet</p>*/}
					{/*		)*/}
					{/*	}*/}
					{/*</div>*/}
				</div>
			</div>

			<div className="flex flex-row gap-2 items-center mt-10">
				<label className="font-bold">Engine:</label>
				<select
					className="font-mono border border-white"
					value={engineVer ?? "--"}
					onChange={(e) => {
						if (e.target.value === "--") handleSetEngine(null);
						else handleSetEngine(e.target.value as EngineVersion | null);
					}}
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
