import { Color, MoveFlag } from "@/app/utils/types";
import { GeneratorContext } from "@/app/Generator";
import { MoveGeometry, GeometryResult } from "@/app/geometries/MoveGeometry";

export class LeaperGeometry implements MoveGeometry {
	constructor(private attackMaskFunc: (sq: number) => bigint) {}

	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		// Retrieve the raw jumping/stepping destination bitboard mask for the piece
		const attacks = this.attackMaskFunc(fromSq);

		return {
			attackMask: attacks,
			flag: MoveFlag.None // Uses standard capture/quiet move configurations
		};
	}
}
