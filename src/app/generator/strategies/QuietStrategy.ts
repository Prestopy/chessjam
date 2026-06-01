import {CaptureStrategy} from "@/app/generator/strategies/CaptureStrategy";
import {Color, Move, MoveFlag} from "@/app/utils/types";
import {GeneratorContext} from "@/app/generator/Generator";
import {not64} from "@/app/utils/bitUtils";
import {allOccupancy} from "@/app/utils/bitboardHelpers";
import {addMovesWithFlags} from "@/app/Move";
import {MoveGeometry} from "@/app/generator/geometries/MoveGeometry";
import {CannotCapture} from "@/app/generator/CannotCapture";
import {CanOnlyCapture} from "@/app/generator/CanOnlyCapture";

export class QuietStrategy {
	constructor(private geometry: MoveGeometry | CannotCapture<MoveGeometry>) {}

	public getGeometry(): MoveGeometry {
		if (this.geometry instanceof CannotCapture) return this.geometry.getGeom();
		else return this.geometry;
	}

	public capturesOnly(): CaptureStrategy {
		return new CaptureStrategy(this.geometry);
	}

	public generateQuiet(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];

		let geom: MoveGeometry;
		if (this.geometry instanceof CannotCapture) geom = this.geometry.getGeom();
		else geom = this.geometry;

		const { attackMask, flag } = geom.getAttackMask(fromSq, color, ctx);

		const filtered = attackMask & not64(allOccupancy(ctx.board));

		// Pass the geometry's flag down to your helper logic (defaults to None if missing)
		addMovesWithFlags(moves, fromSq, filtered, flag ?? MoveFlag.None);
		return moves;
	}
}
