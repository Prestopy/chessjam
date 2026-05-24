import {MoveHistoryEntry} from "@/app/utils";
import {
	allOccupancy, ANTI_DIAG,
	blackOccupancy,
	Board,
	Color, DIAG, enemyOccupancy, FILE, FILE_B, FILE_C, FILE_D, FILE_F, FILE_G,
	lsb,
	makePiece,
	Move,
	MoveFlag, not64,
	NOT_A_FILE, NOT_AB_FILE, NOT_GH_FILE,
	NOT_H_FILE,
	PieceName, RANK,
	RANK_4, RANK_5, reverseBits, rotateBits90Clockwise, rotateBits90Counter,
	squareIndex, squareMask, u64,
	whiteOccupancy
} from "@/app/bitboardHelpers";
import {makeMove, isDoublePushMove, moveToRow, moveToSq, setPromotionPiece} from "@/app/Move";
import {getBoardSquare} from "@/app/Chess";

export interface GeneratorContext {
	board: Board;
	moveHistory: MoveHistoryEntry[];
	castlingRights: {
		kingSide: boolean;
		queenSide: boolean;
	}
}

/**
 * Helper function to add moves from a bitboard of target squares.
 * For each set bit in bb, adds a move from (fromRow, fromCol) to the corresponding square.
 * @param result
 * @param fromSq
 * @param bb
 */
function addMoves(result: Move[], fromSq: number, bb: bigint) {
	while(bb > 0n) {
		const toSq = lsb(bb);
		bb &= bb - 1n; // clear LSB

		result.push(makeMove(fromSq, toSq))
	}
}

/**
 * Helper function to add moves from a bitboard of target squares.
 * For each set bit in bb, adds a move from (fromRow, fromCol) to the corresponding square.
 * Additionally, sets the provided flags on each move (e.g. capture, promotion).
 * @param result
 * @param fromSq
 * @param bb
 * @param flags
 */
function addMovesWithFlags(result: Move[], fromSq: number, bb: bigint, flags: MoveFlag) {
	while(bb > 0n) {
		const toSq = lsb(bb);
		bb &= bb - 1n; // clear LSB

		result.push(makeMove(fromSq, toSq, flags))
	}
}

function addCaptureMoves(result: Move[], fromSq: number, bb: bigint, board: Board) {
	while(bb > 0n) {
		const toSq = lsb(bb);
		bb &= bb - 1n; // clear LSB

		const piece = getBoardSquare(board, toSq);
		if (piece === null) throw new Error('Invalid capture move; no piece found on square indicated by bitboard');

		result.push(makeMove(fromSq, toSq, MoveFlag.Capture, piece))
	}
}

function addCaptureMovesWithFlags(result: Move[], fromSq: number, bb: bigint, board: Board, flags: MoveFlag) {
	while(bb > 0n) {
		const toSq = lsb(bb);
		bb &= bb - 1n; // clear LSB

		const piece = getBoardSquare(board, toSq);
		if (piece === null) throw new Error('Invalid capture move; no piece found on square indicated by bitboard');

		result.push(makeMove(fromSq, toSq, flags | MoveFlag.Capture | piece << 16))
	}
}

export function generatePseudoPawnMoves(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];

	const pawn = squareMask(fromSq);
	const occupied = allOccupancy(ctx.board);
	const enemy = enemyOccupancy(ctx.board, color);

	// Forward move and captures
	if (color === Color.White) {
		const single = u64(pawn << 8n) & not64(occupied);
		const double = u64(single << 8n) & not64(occupied) & RANK_4;
		const captureLeft = u64(pawn << 7n) & enemy & NOT_H_FILE;
		const captureRight = u64(pawn << 9n) & enemy & NOT_A_FILE;

		// FIXME: ENCODE CAPTURED PIECE DATA

		addMoves(moves, fromSq, single);
		addMovesWithFlags(moves, fromSq, double, MoveFlag.DoublePush);
		addCaptureMoves(moves, fromSq, captureLeft | captureRight, ctx.board);
	} else {
		const single = (pawn >> 8n) & not64(occupied);
		const double = (single >> 8n) & not64(occupied) & RANK_5;
		const captureLeft = (pawn >> 9n) & enemy & NOT_H_FILE;
		const captureRight = (pawn >> 7n) & enemy & NOT_A_FILE;

		addMoves(moves, fromSq, single);
		addMovesWithFlags(moves, fromSq, double, MoveFlag.DoublePush);
		addCaptureMoves(moves, fromSq, captureLeft | captureRight, ctx.board);
	}

	// FIXME
	// En passant
	if (ctx.moveHistory.length > 0) {
		const enemyPrevMove = ctx.moveHistory.at(-1)!;

		if (isDoublePushMove(enemyPrevMove.move)) {
			const enemyPawnSq = moveToSq(enemyPrevMove.move);
			const enemyRow = enemyPawnSq >> 3;
			const enemyCol = enemyPawnSq & 7;

			const myRow = fromSq >> 3;
			const myCol = fromSq & 7;

			// En Passant is only possible if the enemy pawn landed exactly
			// on the same rank (row) right next to our pawn (col delta of 1)
			if (myRow === enemyRow && Math.abs(myCol - enemyCol) === 1) {

				if (color === Color.White) {
					// The square directly behind the enemy pawn (where our pawn lands)
					const epTargetSq = enemyPawnSq + 8;
					const epTargetMask = squareMask(epTargetSq);

					// Ensure the move doesn't wrap files (redundancy check for absolute safety)
					const isLegalFile = (myCol === 0 && (epTargetSq & 7) === 1) ||
						(myCol === 7 && (epTargetSq & 7) === 6) ||
						(myCol > 0 && myCol < 7);

					if (isLegalFile) {
						addCaptureMovesWithFlags(moves, fromSq, epTargetMask, ctx.board, MoveFlag.EnPassant);
					}
				} else {
					// Black captures moving down the board
					const epTargetSq = enemyPawnSq - 8;
					const epTargetMask = squareMask(epTargetSq);

					const isLegalFile = (myCol === 0 && (epTargetSq & 7) === 1) ||
						(myCol === 7 && (epTargetSq & 7) === 6) ||
						(myCol > 0 && myCol < 7);

					if (isLegalFile) {
						addCaptureMovesWithFlags(moves, fromSq, epTargetMask, ctx.board, MoveFlag.EnPassant);
					}
				}
			}
		}
	}

	// Promotion
	for (let i=moves.length-1; i>=0; i--) {
		if ((color === Color.White && moveToRow(moves[i]) === 7) || (color === Color.Black && moveToRow(moves[i]) === 0)) {
			// Mark as promotion
			for (const p of [PieceName.Queen, PieceName.Rook, PieceName.Bishop, PieceName.Knight] as PieceName[]) {
				moves.push(setPromotionPiece(moves[i], makePiece(p, color)));
			}

			moves.splice(i, 1);
		}
	}

	return moves;
}
export function generatePseudoRookMoves(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];

	const sqMask = squareMask(fromSq);
	const occupied = allOccupancy(ctx.board);
	const enemy = enemyOccupancy(ctx.board, color);

	const fileMask = FILE[fromSq & 7];
	const rankMask = RANK[fromSq >> 3];

	// --- 1. VERTICAL MOVES ---
	// CRITICAL: Strip the rook out of the occupancy line BEFORE subtracting
	const oFile = (occupied & fileMask) ^ sqMask;

	const fwdFile = u64(oFile - u64(2n * sqMask)) ^ oFile;

	const revOFile = reverseBits(oFile);
	const revSqFile = reverseBits(sqMask);
	const bwdFile = reverseBits(u64(revOFile - u64(2n * revSqFile)) ^ revOFile);

	const verticalMoves = u64(fwdFile | bwdFile) & fileMask;

	// --- 2. HORIZONTAL MOVES ---
	// CRITICAL: Strip the rook out of the occupancy line BEFORE subtracting
	const oRank = (occupied & rankMask) ^ sqMask;

	const fwdRank = u64(oRank - u64(2n * sqMask)) ^ oRank;

	const revORank = reverseBits(oRank);
	const revSqRank = reverseBits(sqMask);
	const bwdRank = reverseBits(u64(revORank - u64(2n * revSqRank)) ^ revORank);

	const horizontalMoves = u64(fwdRank | bwdRank) & rankMask;

	// --- 3. COMBINE ---
	// Mask out the rook's standing square from the total attack set
	const attacks = u64(verticalMoves | horizontalMoves) & u64(~sqMask);

	addMoves(moves, fromSq, attacks & u64(~occupied));
	addCaptureMoves(moves, fromSq, attacks & enemy, ctx.board);

	return moves;
}

export function generatePseudoBishopMoves(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];

	const sqMask = squareMask(fromSq);
	const occupied = allOccupancy(ctx.board);
	const enemy = enemyOccupancy(ctx.board, color);

	// Diagonal moves
	const diagonal = DIAG[fromSq];
	const antiDiagonal = ANTI_DIAG[fromSq];

	const diagOccupancy = occupied & diagonal;
	const antiDiagOccupancy = occupied & antiDiagonal;

	const diagMoves = ((diagOccupancy - 2n * sqMask) ^ reverseBits(reverseBits(diagOccupancy) - 2n * reverseBits(sqMask))) & diagonal;
	const antiDiagMoves = ((antiDiagOccupancy - 2n * sqMask) ^ reverseBits(reverseBits(antiDiagOccupancy) - 2n * reverseBits(sqMask))) & antiDiagonal;
	const attacks = diagMoves | antiDiagMoves;

	addMoves(moves, fromSq, attacks & ~occupied);
	addCaptureMoves(moves, fromSq, attacks & enemy, ctx.board);

	return moves;
}
export function generatePseudoKnightMoves(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];

	const sqMask = squareMask(fromSq);
	const occupied = allOccupancy(ctx.board);
	const enemy = enemyOccupancy(ctx.board, color);

	const attacks = (
		  u64(sqMask << 17n) & NOT_A_FILE
		| u64(sqMask << 15n) & NOT_H_FILE
		| u64(sqMask << 10n) & NOT_AB_FILE
		| u64(sqMask << 6n ) & NOT_GH_FILE
		| sqMask >> 17n & NOT_H_FILE
		| sqMask >> 15n & NOT_A_FILE
		| sqMask >> 10n & NOT_GH_FILE
		| sqMask >> 6n  & NOT_AB_FILE
	);

	addMoves(moves, fromSq, attacks & ~occupied);
	addCaptureMoves(moves, fromSq, attacks & enemy, ctx.board);

	return moves;
}
export function generatePseudoKingMoves(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
	const moves: Move[] = [];

	const sqMask = squareMask(fromSq);
	const occupied = allOccupancy(ctx.board);

	const attacks = (
		  u64(sqMask << 9n) & NOT_A_FILE
		| u64(sqMask << 8n)
		| u64(sqMask << 7n) & NOT_H_FILE
		| u64(sqMask << 1n) & NOT_H_FILE
		| sqMask >> 1n & NOT_A_FILE
		| sqMask >> 7n & NOT_A_FILE
		| sqMask >> 8n
		| sqMask >> 9n & NOT_H_FILE
	)

	addMoves(moves, fromSq, attacks & ~occupied);
	addCaptureMoves(moves, fromSq, attacks & enemyOccupancy(ctx.board, color), ctx.board);

	// Castling
	if (ctx.castlingRights.kingSide) {
		if ((occupied & RANK[fromSq >> 3] & (FILE_F | FILE_G)) === 0n) {
			moves.push(makeMove(fromSq, fromSq + 2, MoveFlag.Castle));
		}
	}
	if (ctx.castlingRights.queenSide) {
		if ((occupied & RANK[fromSq >> 3] & (FILE_B | FILE_C | FILE_D)) === 0n) {
			moves.push(makeMove(fromSq, fromSq - 2, MoveFlag.Castle));
		}
	}

	// FIXME: CHECK IF KING IS IN CHECK IN ANY OF THE TARGET SQUARES (INCLUDING CURRENT SQUARE, FOR CASTLING)

	return moves;
}
