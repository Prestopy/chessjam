import {CaptureStrategy} from "@/app/strategies/CaptureStrategy";
import {Color, Move, MoveFlag} from "@/app/utils/types";
import {GeneratorContext} from "@/app/Generator";
import {not64} from "@/app/utils/bitUtils";
import {allOccupancy} from "@/app/utils/bitboardHelpers";
import {addMovesWithFlags} from "@/app/Move";
import {MoveGeometry} from "@/app/geometries/MoveGeometry";

export class QuietStrategy {
	constructor(private geometry: MoveGeometry) {}

	public capturesOnly(): CaptureStrategy {
		return new CaptureStrategy(this.geometry);
	}

	public generateQuiet(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];
		const { attackMask, flag } = this.geometry.getAttackMask(fromSq, color, ctx);

		const filtered = attackMask & not64(allOccupancy(ctx.board));

		// Pass the geometry's flag down to your helper logic (defaults to None if missing)
		addMovesWithFlags(moves, fromSq, filtered, flag ?? MoveFlag.None);
		return moves;
	}
}
