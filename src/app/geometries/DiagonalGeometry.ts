import { Color, MoveFlag } from "@/app/utils/types";
import { GeneratorContext } from "@/app/Generator";
import { getPawnAttacks } from "@/app/strategies/attacks";
import { MoveGeometry, GeometryResult } from "@/app/geometries/MoveGeometry";

export class DiagonalGeometry implements MoveGeometry {
	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		// Retrieve the standard left/right diagonal step bitboard
		const attacks = getPawnAttacks(fromSq, color);

		return {
			attackMask: attacks,
			flag: MoveFlag.None // Uses standard capture/quiet flag configurations
		};
	}
}
