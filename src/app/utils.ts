export type Color = "W" | "B";

export type PieceName = "King" | "Queen" | "Rook" | "Bishop" | "Knight" | "Pawn";
export interface Piece {
	name: PieceName;
	color: Color;
}

export interface Move {
	fromRow: number;
	fromCol: number;
	toRow: number;
	toCol: number;
}

export type Board = (Piece | null)[][];
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