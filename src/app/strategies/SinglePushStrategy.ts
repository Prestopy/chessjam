import { BasePushStrategy } from "./BasePushStrategy";
import { GeneratorContext } from "@/app/Generator";
import { Color, Move } from "@/app/utils/types";
import {enemyOccupancy, squareMask} from "@/app/utils/bitboardHelpers";
import {addCaptureMoves, addMoves} from "@/app/Move";
import {not64} from "@/app/utils/bitUtils";

export class SinglePushStrategy extends BasePushStrategy {
	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];
		const pawnBitboard = squareMask(fromSq);

		// Shift exactly 1 square forward
		const targetSquare = this.shiftForward(pawnBitboard, color, 1);

		if (this.captureMode) {
			// In capture-only mode, we want to generate moves that capture an enemy piece on the target square
			const enemy = enemyOccupancy(ctx.board, color);
			const filteredTargets = targetSquare & enemy;
			addCaptureMoves(moves, fromSq, filteredTargets, ctx.board);
			return moves;
		} else {
			const occupied = enemyOccupancy(ctx.board, color);
			const filteredTargets = targetSquare & not64(occupied);
			addMoves(moves, fromSq, filteredTargets);
		}

		return moves;
	}
}
