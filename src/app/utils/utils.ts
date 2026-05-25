import {moveFromCol, moveFromRow, moveToCol, moveToRow} from "@/app/Move";
import {Color, Move, Piece, PieceName} from "@/app/utils/types";

export function swapColor(color: Color): Color {
	return (color+1) % 2;
}

// ##### Piece utils #####
export function makePiece(pieceName: PieceName, color: Color): Piece {
	return pieceName + color * 6;
}

export function pieceName(p: Piece): PieceName {
	return (p % 6) as PieceName;
}

export function pieceColor(p: Piece): Color {
	return (p >= 6 ? Color.Black : Color.White);
}

// ##### Misc #####
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

export function moveToNotation(move: Move): string {
	const files = "abcdefgh";
	const fromFile = files[moveFromCol(move)];
	const fromRank = 8 - moveFromRow(move);
	const toFile = files[moveToCol(move)];
	const toRank = 8 - moveToRow(move);

	return `${fromFile}${fromRank}${toFile}${toRank}`;
}

/**
 * Converts (row, col) to a square index from 0 to 63, where 0 is a1 and 63 is h8.
 * @param row
 * @param col
 */
export function squareIndex(row: number, col: number): number {
	return row * 8 + col;
}
