import { Color, Move, PieceName } from "@/app/utils/types";
import { moveToRow, setPromotionPiece } from "@/app/Move";
import {StrategyModifier} from "@/app/strategies/StrategyModifier";
import {makePiece} from "@/app/utils/utils";

export interface PromotionConfig {
	whitePromotionRank: number;
	blackPromotionRank: number;
	allowedPieces: PieceName[];
}

export class PromotionModifier implements StrategyModifier {
	constructor(
		private config: PromotionConfig = {
			whitePromotionRank: 7,
			blackPromotionRank: 0,
			allowedPieces: [PieceName.Queen, PieceName.Rook, PieceName.Bishop, PieceName.Knight]
		}
	) {}

	/**
	 * Intercepts and transforms standard moves into promotion instances if criteria match.
	 */
	apply(moves: Move[], color: Color): Move[] {
		const targetPromoRank = color === Color.White ? this.config.whitePromotionRank : this.config.blackPromotionRank;

		for (let i = moves.length - 1; i >= 0; i--) {
			if (moveToRow(moves[i]) === targetPromoRank) {
				// Generate a clone for every option in our allowed variant list
				for (const pieceName of this.config.allowedPieces) {
					moves.push(setPromotionPiece(moves[i], makePiece(pieceName, color)));
				}
				// Splice out the original baseline pawn target move
				moves.splice(i, 1);
			}
		}
		return moves;
	}
}
