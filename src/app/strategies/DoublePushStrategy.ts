import { BasePushStrategy } from "./BasePushStrategy";
import { GeneratorContext } from "@/app/Generator";
import { Color, Move, MoveFlag } from "@/app/utils/types";
import { allOccupancy, squareMask } from "@/app/utils/bitboardHelpers";
import { not64 } from "@/app/utils/bitUtils";
import {addCapturesWithFlags, addMovesWithFlags} from "@/app/Move";

export interface DoublePushConfig {
	whiteDoublePushRank: number; // Row index destination (e.g., 3 for Rank 4)
	blackDoublePushRank: number; // Row index destination (e.g., 4 for Rank 5)
}

export class DoublePushStrategy extends BasePushStrategy {
	constructor(
		private doubleConfig: DoublePushConfig = {
			whiteDoublePushRank: 3,
			blackDoublePushRank: 4,
		}
	) {super()}

	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];
		const currentRank = fromSq >> 3;

		// Verify the piece is sitting exactly 2 steps away from its valid target rank
		const isInitialWhiteRank = color === Color.White && currentRank === (this.doubleConfig.whiteDoublePushRank - 2);
		const isInitialBlackRank = color === Color.Black && currentRank === (this.doubleConfig.blackDoublePushRank + 2);

		if (!isInitialWhiteRank && !isInitialBlackRank) {
			return moves;
		}

		const pawnBitboard = squareMask(fromSq);
		const occupied = allOccupancy(ctx.board);

		// Standard rules: The intermediate square must be completely clear to pass through
		const pathSquare = this.shiftForward(pawnBitboard, color, 1);
		if ((pathSquare & occupied) !== 0n) {
			return moves; // Path is blocked
		}

		// Project target landing zone 2 squares away
		const targetSquare = this.shiftForward(pawnBitboard, color, 2);

		if (this.captureMode) {
			// In capture-only mode, we want to generate moves that capture an enemy piece on the target square
			const enemy = allOccupancy(ctx.board) & not64(occupied); // Enemy pieces are those on occupied squares that aren't friendly
			const filteredTargets = targetSquare & enemy;
			addCapturesWithFlags(moves, fromSq, filteredTargets, ctx.board, MoveFlag.DoublePush);
			return moves;
		} else {
			const filteredTargets = targetSquare & not64(occupied);
			addMovesWithFlags(moves, fromSq, filteredTargets, MoveFlag.DoublePush);
		}
		return moves;
	}
}
