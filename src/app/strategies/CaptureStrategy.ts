// The Capture Engine Wrapper
import {Color, Move, MoveFlag} from "@/app/utils/types";
import {GeneratorContext} from "@/app/Generator";
import {enemyOccupancy} from "@/app/utils/bitboardHelpers";
import {addCapturesWithFlags, addMoves, addMovesWithFlags} from "@/app/Move";
import {MoveGeometry} from "@/app/geometries/MoveGeometry";

export class CaptureStrategy {
	constructor(private geometry: MoveGeometry) {
	}

	public generateCaptures(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];
		const {attackMask, flag} = this.geometry.getAttackMask(fromSq, color, ctx);

		if (flag & MoveFlag.EnPassant) {
			addMovesWithFlags(moves, fromSq, attackMask, flag);
		} else {
			const filtered = attackMask & enemyOccupancy(ctx.board, color);
			addCapturesWithFlags(moves, fromSq, filtered, ctx.board, flag ?? MoveFlag.None);
		}

		// Pass the geometry's flag down to your helper capture logic

		return moves;
	}
}
