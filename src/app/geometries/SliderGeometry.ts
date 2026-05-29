import { allOccupancy } from "@/app/utils/bitboardHelpers";
import { Color, MoveFlag } from "@/app/utils/types";
import { GeneratorContext } from "@/app/Generator";
import { MoveGeometry, GeometryResult } from "@/app/geometries/MoveGeometry";

export class SliderGeometry implements MoveGeometry {
	constructor(private attackMaskFunc: (sq: number, occupied: bigint) => bigint) {}

	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		// Collect current snapshot of total board occupancy to block rays properly
		const occupied = allOccupancy(ctx.board);

		// Generate the full sliding ray attack vectors using your magic bitboard function
		const attacks = this.attackMaskFunc(fromSq, occupied);

		return {
			attackMask: attacks,
			flag: MoveFlag.None // Uses standard capture/quiet flag configurations
		};
	}
}
