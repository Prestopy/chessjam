import {Board, Color, MoveHistoryEntry, Piece, PieceName, swapColor} from "@/app/utils";
import { Move } from "@/app/Move";

interface GeneratorContext {
	board: Board;
	moveHistory: MoveHistoryEntry[];
	numRanks: number;
	castlingRights: {
		kingSide: boolean;
		queenSide: boolean;
	}
}

export function generatePseudoPawnMoves(fromRow: number, fromCol: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];
	const direction = color === "W" ? -1 : 1;
	const startRow = color === "W" ? ctx.numRanks - 2 : 1;

	// Single step forward
	const oneStepRow = fromRow + direction;
	if (ctx.board[oneStepRow]?.[fromCol] === null) {
		// Normal move
		moves.push(new Move(fromRow, fromCol, oneStepRow, fromCol));

		// Double step from start
		const twoStepRow = fromRow + 2 * direction;
		if (fromRow === startRow && ctx.board[twoStepRow]?.[fromCol] === null) {
			moves.push(new Move(fromRow, fromCol, twoStepRow, fromCol));
		}
	}

	// Captures (diagonal left/right)
	for (const dc of [-1, 1]) {
		const toCol = fromCol + dc;
		const toRow = fromRow + direction;
		if (ctx.board[toRow]?.[toCol] && ctx.board[toRow][toCol].color !== color) {
			moves.push(new Move(fromRow, fromCol, toRow, toCol).markAsCapture(ctx.board[toRow][toCol]));
		}
	}

	// En passant
	if (ctx.moveHistory.length > 0) {
		const enemyPrevMove = ctx.moveHistory.at(-1)!;
		const epFromRow = color === "W" ? 3 : ctx.numRanks - 4;
		const epToRow = color === "W" ? 2 : ctx.numRanks - 3;

		if (
			fromRow === epFromRow &&
			enemyPrevMove.piece.name === "Pawn" &&
			enemyPrevMove.piece.color !== color &&
			Math.abs(enemyPrevMove.move.fromRow - enemyPrevMove.move.toRow) === 2 &&
			Math.abs(fromCol - enemyPrevMove.move.toCol) === 1
		) {
			moves.push(new Move(fromRow, fromCol, epToRow, enemyPrevMove.move.toCol).markAsEnPassant(swapColor(color)));
		}
	}

	// Promotion
	for (let i=moves.length-1; i>=0; i--) {
		if (moves[i].toRow === 0 || moves[i].toRow === ctx.numRanks - 1) {
			// Add promotion moves
			for (const p of ["Queen", "Rook", "Bishop", "Knight"] as PieceName[]) {
				moves.push(moves[i].copy().markAsPromotion({
					name: p,
					color: color
				}));
			}

			moves.splice(i, 1); // Remove the original move
		}
	}

	return moves;
}
export function generatePseudoRookMoves(fromRow: number, fromCol: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];
	const deltas = [
		[1, 0], [-1, 0], [0, 1], [0, -1]
	];

	for (const [dr, dc] of deltas) {
		let row = fromRow + dr;
		let col = fromCol + dc;

		while (ctx.board[row]?.[col] !== undefined) {
			const blocker = ctx.board[row][col];
			if (blocker === null) {
				moves.push(new Move(fromRow, fromCol, row, col));
			} else {
				if (blocker.color !== color) {
					moves.push(new Move(fromRow, fromCol, row, col).markAsCapture(blocker));
				}
				break; // Stop after first blocker
			}
			row += dr;
			col += dc;
		}
	}

	return moves;
}
export function generatePseudoBishopMoves(fromRow: number, fromCol: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];
	const deltas = [
		[1, 1], [1, -1], [-1, 1], [-1, -1]
	];

	for (const [dr, dc] of deltas) {
		let row = fromRow + dr;
		let col = fromCol + dc;
		while (ctx.board[row]?.[col] !== undefined) {
			const blocker = ctx.board[row][col];
			if (blocker === null) {
				moves.push(new Move(fromRow, fromCol, row, col));
			} else {
				if (blocker.color !== color) {
					moves.push(new Move(fromRow, fromCol, row, col).markAsCapture(blocker));
				}
				break;
			}
			row += dr;
			col += dc;
		}
	}

	return moves;
}
export function generatePseudoKnightMoves(fromRow: number, fromCol: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];
	const deltas = [
		[-2, -1], [-2, 1], [2, -1], [2, 1],
		[-1, -2], [-1, 2], [1, -2], [1, 2]
	];

	for (const [dr, dc] of deltas) {
		const row = fromRow + dr;
		const col = fromCol + dc;
		if (ctx.board[row]?.[col] !== undefined) {
			const target = ctx.board[row][col];
			if (target === null) {
				moves.push(new Move(fromRow, fromCol, row, col));
			} else if (target.color !== color) {
				moves.push(new Move(fromRow, fromCol, row, col).markAsCapture(target));
			}
		}
	}

	return moves;
}
export function generatePseudoKingMoves(fromRow: number, fromCol: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];
	for (let dr = -1; dr <= 1; dr++) {
		for (let dc = -1; dc <= 1; dc++) {
			if (dr === 0 && dc === 0) continue;
			const row = fromRow + dr;
			const col = fromCol + dc;
			if (ctx.board[row]?.[col] !== undefined) {
				const target = ctx.board[row][col];
				if (target === null) {
					moves.push(new Move(fromRow, fromCol, row, col));
				} else if (target.color !== color) {
					moves.push(new Move(fromRow, fromCol, row, col).markAsCapture(target));
				}
			}
		}
	}

	// Castling
	if (ctx.castlingRights.kingSide) {
		const row = fromRow;
		if (
			ctx.board[row][fromCol + 1] === null &&
			ctx.board[row][fromCol + 2] === null
		) {
			moves.push(new Move(fromRow, fromCol, row, fromCol + 2).markAsCastle());
		}
	}
	if (ctx.castlingRights.queenSide) {
		const row = fromRow;
		if (
			ctx.board[row][fromCol - 1] === null &&
			ctx.board[row][fromCol - 2] === null &&
			ctx.board[row][fromCol - 3] === null
		) {
			moves.push(new Move(fromRow, fromCol, row, fromCol - 2).markAsCastle());
		}
	}

	return moves;
}