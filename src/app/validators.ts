import { Board, Color, MoveHistoryEntry } from "@/app/utils";
import { Move } from "@/app/Move";

interface GeneratorContext {
	board: Board;
	moveHistory: MoveHistoryEntry[];
	numRanks: number;
}

export function generatePseudoPawnMoves(fromRow: number, fromCol: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];
	const direction = color === "W" ? -1 : 1;
	const startRow = color === "W" ? ctx.numRanks - 2 : 1;

	// Single step forward
	const oneStepRow = fromRow + direction;
	if (ctx.board[oneStepRow]?.[fromCol] === null) {
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
		if (ctx.board[toRow]?.[toCol] && ctx.board[toRow][toCol]?.color !== color) {
			moves.push(new Move(fromRow, fromCol, toRow, toCol));
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
			moves.push(new Move(fromRow, fromCol, epToRow, enemyPrevMove.move.toCol));
		}
	}

	return moves;
}
export function generatePseudoRookMoves(fromRow: number, fromCol: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];
	const directions = [
		[1, 0], [-1, 0], [0, 1], [0, -1]
	];

	for (const [dr, dc] of directions) {
		let r = fromRow + dr;
		let c = fromCol + dc;
		while (ctx.board[r]?.[c] !== undefined) {
			if (ctx.board[r][c] === null) {
				moves.push(new Move(fromRow, fromCol, r, c));
			} else {
				if (ctx.board[r][c]!.color !== color) {
					moves.push(new Move(fromRow, fromCol, r, c));
				}
				break; // Stop after first blocker
			}
			r += dr;
			c += dc;
		}
	}

	return moves;
}
export function generatePseudoBishopMoves(fromRow: number, fromCol: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];
	const directions = [
		[1, 1], [1, -1], [-1, 1], [-1, -1]
	];

	for (const [dr, dc] of directions) {
		let r = fromRow + dr;
		let c = fromCol + dc;
		while (ctx.board[r]?.[c] !== undefined) {
			if (ctx.board[r][c] === null) {
				moves.push(new Move(fromRow, fromCol, r, c));
			} else {
				if (ctx.board[r][c]!.color !== color) {
					moves.push(new Move(fromRow, fromCol, r, c));
				}
				break;
			}
			r += dr;
			c += dc;
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
		const r = fromRow + dr;
		const c = fromCol + dc;
		if (ctx.board[r]?.[c] !== undefined) {
			const target = ctx.board[r][c];
			if (target === null || target.color !== color) {
				moves.push(new Move(fromRow, fromCol, r, c));
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
			const r = fromRow + dr;
			const c = fromCol + dc;
			if (ctx.board[r]?.[c] !== undefined) {
				const target = ctx.board[r][c];
				if (target === null || target.color !== color) {
					moves.push(new Move(fromRow, fromCol, r, c));
				}
			}
		}
	}
	return moves;
}