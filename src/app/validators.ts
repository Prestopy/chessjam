import {Board, Color, Move, MoveHistoryEntry} from "@/app/utils";

interface ValidatorContext {
	board: Board;
	moveHistory: MoveHistoryEntry[];
	numRanks: number;
}

/**
 * Validates a pawn move, including standard moves, captures, and en passant.
 * This function assumes the move is within bounds and that the piece being moved is indeed a pawn of the specified color.
 * @param move
 * @param color
 * @param ctx
 */
export function validatePawnMove(move: Move, color: Color, ctx: ValidatorContext): {
	valid: boolean;
	isEnPassant: boolean;
} {
	const {fromRow, fromCol, toRow, toCol} = move;
	const piece = ctx.board[fromRow][fromCol];
	if (!piece) return { valid: false, isEnPassant: false };

	const direction = color === "W" ? -1 : 1; // White moves up, Black moves down
	const startRow = color === "W" ? ctx.numRanks - 2 : 1; // Starting row for pawns

	// Standard move
	if (toCol === fromCol && toRow === fromRow + direction && ctx.board[toRow][toCol] === null) {
		return {
			valid: true,
			isEnPassant: false
		};
	}

	// Double move from starting position
	if (toCol === fromCol && fromRow === startRow && toRow === fromRow + 2 * direction &&
		ctx.board[fromRow+direction][toCol] === null && ctx.board[toRow][toCol] === null) {
		return {
			valid: true,
			isEnPassant: false
		};
	}

	// En passant
	if (ctx.moveHistory.length >= 1) {
		const enemyPrevMove = ctx.moveHistory[ctx.moveHistory.length - 1]; // Last move made

		const epFromRow = color === "W" ? 3 : ctx.numRanks - 4;
		const epToRow   = color === "W" ? 2 : ctx.numRanks - 3;

		if (enemyPrevMove.piece.color !== color && enemyPrevMove.piece.name === "Pawn" && Math.abs(enemyPrevMove.move.fromRow - enemyPrevMove.move.toRow) === 2 && // confirm previous piece's move allows for en passant
			fromRow === epFromRow && Math.abs(fromCol - enemyPrevMove.move.toCol) === 1 && // confirm our pawn is in the correct position
			toCol === enemyPrevMove.move.toCol && toRow === epToRow) { // confirm we're moving to the correct square
			return {
				valid: true,
				isEnPassant: true
			};
		}
	}

	// Capturing move
	if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction &&
		ctx.board[toRow][toCol] !== null && ctx.board[toRow][toCol]?.color !== piece.color) {
		return {
			valid: true,
			isEnPassant: false
		};
	}

	return {
		valid: false,
		isEnPassant: false
	}
}

/**
 * Validates a rook move, ensuring it moves in a straight line and that its path is not blocked.
 * This function assumes the move is within bounds and that the piece being moved is indeed a rook of the specified color.
 * @param move
 * @param color
 * @param ctx
 */
export function validateRookMove(move: Move, color: Color, ctx: ValidatorContext): {
	valid: boolean
} {
	const {fromRow, fromCol, toRow, toCol} = move;
	const piece = ctx.board[fromRow][fromCol];
	if (!piece) return { valid: false };

	if (fromRow !== toRow && fromCol !== toCol) return { valid: false }; // Must move in straight line
	const rowStep = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
	const colStep = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);

	let r = fromRow + rowStep;
	let c = fromCol + colStep;
	while (r !== toRow || c !== toCol) {
		if (ctx.board[r][c] !== null) return { valid: false }; // Path is blocked
		r += rowStep;
		c += colStep;
	}

	if (ctx.board[toRow][toCol]?.color === color) return { valid: false }; // Can't capture own piece

	return { valid: true };
}

export function validateBishopMove(move: Move, color: Color, ctx: ValidatorContext): {
	valid: boolean
} {
	const {fromRow, fromCol, toRow, toCol} = move;
	const piece = ctx.board[fromRow][fromCol];
	if (!piece) return { valid: false };

	if (Math.abs(fromRow-toRow) !== Math.abs(fromCol-toCol)) return { valid: false }; // Must move in straight line
	const rowStep = toRow > fromRow ? 1 : -1;
	const colStep = toCol > fromCol ? 1 : -1;

	let r = fromRow + rowStep;
	let c = fromCol + colStep;
	while (r !== toRow && c !== toCol) {
		if (ctx.board[r][c] !== null) return { valid: false }; // Path is blocked
		r += rowStep;
		c += colStep;
	}

	if (ctx.board[toRow][toCol]?.color === color) return { valid: false }; // Can't capture own piece

	return { valid: true };
}

export function validateKnightMove(move: Move, color: Color, ctx: ValidatorContext): {
	valid: boolean
} {
	const {fromRow, fromCol, toRow, toCol} = move;
	const piece = ctx.board[fromRow][fromCol];
	if (!piece) return { valid: false };

	const rowDiff = Math.abs(fromRow - toRow);
	const colDiff = Math.abs(fromCol - toCol);
	if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) return { valid: false }; // Knight moves in L shape

	if (ctx.board[toRow][toCol]?.color === color) return { valid: false }; // Can't capture own piece

	return { valid: true };
}

export function validateKingMove(move: Move, color: Color, ctx: ValidatorContext): {
	valid: boolean
} {
	const {fromRow, fromCol, toRow, toCol} = move;
	const piece = ctx.board[fromRow][fromCol];
	if (!piece) return { valid: false };

	if (Math.abs(fromRow - toRow) > 1 || Math.abs(fromCol - toCol) > 1) return { valid: false }; // King can only move one square in any direction

	if (ctx.board[toRow][toCol]?.color === color) return { valid: false }; // Can't capture own piece

	return { valid: true };
}