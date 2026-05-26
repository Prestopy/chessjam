import {PieceStrategy} from "@/app/generators/Strategy";
import {GeneratorContext} from "@/app/generators/generators";
import {Color, Move, MoveFlag, PieceName} from "@/app/utils/types";
import {allOccupancy, enemyOccupancy, squareMask} from "@/app/utils/bitboardHelpers";
import {not64, u64} from "@/app/utils/bitUtils";
import {
	addCaptureMoves,
	addMoves,
	addMovesWithFlags,
	isDoublePushMove,
	makeMove, moveToRow,
	moveToSq,
	setPromotionPiece
} from "@/app/Move";
import {getPawnAttacks} from "@/app/generators/attacks";
import {makePiece, swapColor} from "@/app/utils/utils";

interface PawnConfig {
	allowDoublePush: boolean;
	allowEnPassant: boolean;
	whiteDoublePushRank: number; // Destination row index (e.g., 3 for Rank 4)
	blackDoublePushRank: number; // Destination row index (e.g., 4 for Rank 5)
	whitePromotionRank: number;
	blackPromotionRank: number;
}

export class PawnStrategy implements PieceStrategy {
	constructor(private config: PawnConfig = {
		allowDoublePush: true,
		allowEnPassant: true,
		whiteDoublePushRank: 3,
		blackDoublePushRank: 4,
		whitePromotionRank: 7,
		blackPromotionRank: 0
	}) {}

	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];
		const pawn = squareMask(fromSq);
		const occupied = allOccupancy(ctx.board);
		const enemy = enemyOccupancy(ctx.board, color);

		const currentRank = fromSq >> 3; // Calculate base row index directly

		if (color === Color.White) {
			const single = u64(pawn << 8n) & not64(occupied);
			addMoves(moves, fromSq, single);

			// Verify pawn is starting exactly 2 steps back from target push rank
			if (this.config.allowDoublePush && currentRank === (this.config.whiteDoublePushRank - 2)) {
				const double = u64(single << 8n) & not64(occupied);
				addMovesWithFlags(moves, fromSq, double, MoveFlag.DoublePush);
			}
		} else {
			const single = u64(pawn >> 8n) & not64(occupied);
			addMoves(moves, fromSq, single);

			// Verify pawn is starting exactly 2 steps back from target push rank
			if (this.config.allowDoublePush && currentRank === (this.config.blackDoublePushRank + 2)) {
				const double = u64(single >> 8n) & not64(occupied);
				addMovesWithFlags(moves, fromSq, double, MoveFlag.DoublePush);
			}
		}

		// Attacks (Cleaned up the duplicate execution calls)
		const attacks = getPawnAttacks(fromSq, color) & enemy;
		addCaptureMoves(moves, fromSq, attacks, ctx.board);

		// En Passant
		if (this.config.allowEnPassant && ctx.moveHistory.length > 0) {
			const enemyPrevMove = ctx.moveHistory.at(-1)!;
			if (isDoublePushMove(enemyPrevMove.move)) {
				const enemyPawnSq = moveToSq(enemyPrevMove.move);
				const enemyRow = enemyPawnSq >> 3;
				const enemyCol = enemyPawnSq & 7;
				const myRow = fromSq >> 3;
				const myCol = fromSq & 7;

				if (myRow === enemyRow && Math.abs(myCol - enemyCol) === 1) {
					const epTargetSq = enemyPawnSq + (color === Color.White ? 8 : -8);
					moves.push(makeMove(fromSq, epTargetSq, MoveFlag.EnPassant, makePiece(PieceName.Pawn, swapColor(color))));
				}
			}
		}

		// Handle Promotions dynamically based on configuration
		const targetPromoRank = color === Color.White ? this.config.whitePromotionRank : this.config.blackPromotionRank;
		for (let i = moves.length - 1; i >= 0; i--) {
			if (moveToRow(moves[i]) === targetPromoRank) {
				for (const p of [PieceName.Queen, PieceName.Rook, PieceName.Bishop, PieceName.Knight]) {
					moves.push(setPromotionPiece(moves[i], makePiece(p, color)));
				}
				moves.splice(i, 1);
			}
		}

		return moves;
	}
}
