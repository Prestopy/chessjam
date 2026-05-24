import {Engine} from "@/app/engines/Engine";
import Engine_v1 from "@/app/engines/Engine_v1";
import Engine_v2 from "@/app/engines/Engine_v2";
import Engine_v3 from "@/app/engines/Engine_v3";
import Engine_v4 from "@/app/engines/Engine_v4";
import {Color, makePiece, Move, Piece, PieceName} from "@/app/bitboardHelpers";
import {moveFromCol, moveFromRow, moveToCol, moveToRow} from "@/app/Move";
import Engine_v5 from "@/app/engines/Engine_v5";

export interface GameDetails {
	state: GameState;
	winner: Color | null;
}

export enum GameState {
	Running = "Running",
	Checkmate = "Checkmate",
	Stalemate = "Stalemate",
	Draw = "Draw",
}

export interface MoveHistoryEntry {
	move: Move;
	piece: Piece
}

export const pieceSymbols: { [key in PieceName]: { 0: string; 1: string } } = {
	5: { 0: "/pieces/wk.svg", 1: "/pieces/bk.svg" },
	4: { 0: "/pieces/wq.svg", 1: "/pieces/bq.svg" },
	3: { 0: "/pieces/wr.svg", 1: "/pieces/br.svg" },
	2: { 0: "/pieces/wb.svg", 1: "/pieces/bb.svg" },
	1: { 0: "/pieces/wn.svg", 1: "/pieces/bn.svg" },
	0: { 0: "/pieces/wp.svg", 1: "/pieces/bp.svg" }
}

export function swapColor(color: Color): Color {
	return (color+1) % 2;
}

// ENGINES
export type EngineVersion = "1" | "2" | "3" | "4" | "5" | "6";
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
		{
			version: "4",
			name: "Eval board with point count",
			getEngine: () => new Engine_v4(),
		},
		{
			version: "5",
			name: "Search v1",
			getEngine: () => new Engine_v5(),
		},
		{
			version: "6",
			name: "Search with PST",
			getEngine: () => new Engine_v5(),
		},
	];

export function getEngineDetail(ver: string) {
	return allEngines.find(e => e.version === ver) ?? null;
}


export function standardChessSetup(rank: number, file: number): Piece | null {
	const pieceOrder: PieceName[] = [
		PieceName.Rook,
		PieceName.Knight,
		PieceName.Bishop,
		PieceName.Queen,
		PieceName.King,
		PieceName.Bishop,
		PieceName.Knight,
		PieceName.Rook
	];

	if (rank === 0) {
		return makePiece(pieceOrder[file], Color.White);
	} else if (rank === 1) {
		return makePiece(PieceName.Pawn, Color.White);
	} else if (rank === 6) {
		return makePiece(PieceName.Pawn, Color.Black);
	} else if (rank === 7) {
		return makePiece(pieceOrder[file], Color.Black);
	} else {
		return null;
	}
}

// export function countPoints(board: Board, color: string): number {
// 	const pieceValues: { [key: string]: number } = {
// 		"Pawn": 1,
// 		"Knight": 3,
// 		"Bishop": 3,
// 		"Rook": 5,
// 		"Queen": 9,
// 		"King": 0
// 	};
//
// 	let totalPoints = 0;
// 	for (const rank of board) {
// 		for (const piece of rank) {
// 			if (piece && piece.color === color) {
// 				totalPoints += pieceValues[piece.name] || 0;
// 			}
// 		}
// 	}
// 	return totalPoints;
// }

export function moveToNotation(move: Move): string {
	const files = "abcdefgh";
	const fromFile = files[moveFromCol(move)];
	const fromRank = 8 - moveFromRow(move);
	const toFile = files[moveToCol(move)];
	const toRank = 8 - moveToRow(move);

	return `${fromFile}${fromRank}${toFile}${toRank}`;
}
