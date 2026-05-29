import { Color, MoveFlag } from "@/app/utils/types";
import { GeneratorContext } from "@/app/Generator";
import { isDoublePushMove, moveToSq } from "@/app/Move";
import { MoveGeometry, GeometryResult } from "@/app/geometries/MoveGeometry";
import {squareMask} from "@/app/utils/bitboardHelpers";

export class EnPassantGeometry implements MoveGeometry {

	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		let mask = 0n;

		// En Passant requires a history context to look back at the enemy's last move
		if (ctx.moveHistory.length === 0) {
			return { attackMask: 0n, flag: MoveFlag.EnPassant };
		}

		const enemyPrevMove = ctx.moveHistory.at(-1)!;

		if (isDoublePushMove(enemyPrevMove.move)) {
			const enemyPawnSq = moveToSq(enemyPrevMove.move);
			const enemyRow = enemyPawnSq >> 3;
			const enemyCol = enemyPawnSq & 7;
			const myRow = fromSq >> 3;
			const myCol = fromSq & 7;

			// Check if the enemy pawn landed directly adjacent to our pawn on the same row
			if (myRow === enemyRow && Math.abs(myCol - enemyCol) === 1) {
				// Target square is one square "behind" the enemy pawn
				const epTargetSq = enemyPawnSq + (color === Color.White ? 8 : -8);
				mask |= squareMask(epTargetSq);
			}
		}

		return {
			attackMask: mask,
			flag: MoveFlag.EnPassant
		};
	}
}
