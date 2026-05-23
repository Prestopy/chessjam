import {Move} from "@/app/Move";
import {Engine} from "@/app/engines/Engine";
import Engine_v1 from "@/app/engines/Engine_v1";
import Engine_v2 from "@/app/engines/Engine_v2";
import Engine_v3 from "@/app/engines/Engine_v3";

export type Color = "W" | "B";

export type PieceName = "King" | "Queen" | "Rook" | "Bishop" | "Knight" | "Pawn";
export interface Piece {
	name: PieceName;
	color: Color;
}

export type EngineVersion = "1" | "2" | "3";
export interface EngineDetail {
	version: EngineVersion,
	name: string,
	getEngine: () => Engine
}
export const allEngines: EngineDetail[] =
	[
		{
			version: "1",
			name: "Random Move",
			getEngine: () => new Engine_v1(),
		},
		{
			version: "2",
			name: "Prioritize Capture Moves",
			getEngine: () => new Engine_v2(),
		},
		{
			version: "3",
			name: "Prioritize Valuable Piece Captures",
			getEngine: () => new Engine_v3(),
		},
	];

export function getEngineDetail(ver: string) {
	return allEngines.find(e => e.version === ver) ?? null;
}

export type Board = (Piece | null)[][];
export interface GameDetails {
	state: GameState;
	winner: Color | null;
}
export type GameState = "running" | "checkmate" | "stalemate" | "draw"
export interface MoveHistoryEntry {
	move: Move;
	piece: Piece
}

export const pieceSymbols: { [key in PieceName]: { W: string; B: string } } = {
	"King":   { W: "/pieces/wk.svg", B: "/pieces/bk.svg" },
	"Queen":  { W: "/pieces/wq.svg", B: "/pieces/bq.svg" },
	"Rook":   { W: "/pieces/wr.svg", B: "/pieces/br.svg" },
	"Bishop": { W: "/pieces/wb.svg", B: "/pieces/bb.svg" },
	"Knight": { W: "/pieces/wn.svg", B: "/pieces/bn.svg" },
	"Pawn":   { W: "/pieces/wp.svg", B: "/pieces/bp.svg" }
}

export function swapColor(color: Color): Color {
	return color === "W" ? "B" : "W";
}

// Piece generators
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function randomPiece(_rank: number, _file: number): Piece {
	const pieceNames: PieceName[] = ["King", "Queen", "Rook", "Bishop", "Knight", "Pawn"];
	const colors: Color[] = ["W", "B"];
	const randomName = pieceNames[Math.floor(Math.random() * pieceNames.length)];
	const randomColor = colors[Math.floor(Math.random() * colors.length)];

	return { name: randomName, color: randomColor };
}

export function randomPieceOrEmpty(_rank: number, _file: number): Piece | null {
	const pieceNames: (PieceName | null)[] = ["King", "Queen", "Rook", "Bishop", "Knight", "Pawn", null];
	const colors: Color[] = ["W", "B"];
	const randomName = pieceNames[Math.floor(Math.random() * pieceNames.length)];
	if (randomName === null) return null;

	const randomColor = colors[Math.floor(Math.random() * colors.length)];

	return { name: randomName, color: randomColor };
}

export function standardChessSetup(rank: number, file: number): Piece | null {
	const pieceOrder: PieceName[] = ["Rook", "Knight", "Bishop", "Queen", "King", "Bishop", "Knight", "Rook"];

	if (rank === 0) {
		return { name: pieceOrder[file], color: "B" };
	} else if (rank === 1) {
		return { name: "Pawn", color: "B" };
	} else if (rank === 6) {
		return { name: "Pawn", color: "W" };
	} else if (rank === 7) {
		return { name: pieceOrder[file], color: "W" };
	} else {
		return null;
	}
}

export function moveToNotation(move: Move): string {
	const files = "abcdefgh";
	const fromFile = files[move.fromCol];
	const fromRank = 8 - move.fromRow;
	const toFile = files[move.toCol];
	const toRank = 8 - move.toRow;

	return `${fromFile}${fromRank}${toFile}${toRank}`;
}
