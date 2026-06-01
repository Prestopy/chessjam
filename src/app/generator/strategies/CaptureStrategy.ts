// The Capture Engine Wrapper
import {Color, Move, MoveFlag} from "@/app/utils/types";
import {GeneratorContext} from "@/app/generator/Generator";
import {enemyOccupancy} from "@/app/utils/bitboardHelpers";
import {addCapturesWithFlags, addMovesWithFlags} from "@/app/Move";
import {MoveGeometry} from "@/app/generator/geometries/MoveGeometry";
import {CanOnlyCapture} from "@/app/generator/CanOnlyCapture";

export class CaptureStrategy {
	constructor(private geometry: MoveGeometry | CanOnlyCapture<MoveGeometry>) {}

	public getGeometry(): MoveGeometry {
		if (this.geometry instanceof CanOnlyCapture) return this.geometry.getGeom();
		else return this.geometry;
	}

	public generateCaptures(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];

		let geom;
		if (this.geometry instanceof CanOnlyCapture) geom = this.geometry.getGeom();
		else geom = this.geometry;

		const {attackMask, flag} = geom.getAttackMask(fromSq, color, ctx);

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
