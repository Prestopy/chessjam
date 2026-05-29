import { BasePushGeometry } from "./BasePushGeometry";
import { GeneratorContext } from "@/app/Generator";
import { Color, MoveFlag } from "@/app/utils/types";
import { squareMask } from "@/app/utils/bitboardHelpers";
import { MoveGeometry, GeometryResult } from "@/app/geometries/MoveGeometry";

export class SinglePushGeometry extends BasePushGeometry implements MoveGeometry {
	constructor() {
		super();
	}

	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		const pawnBitboard = squareMask(fromSq);

		// Shift exactly 1 square forward based on the piece's color direction
		const targetSquare = this.shiftForward(pawnBitboard, color, 1);

		return {
			attackMask: targetSquare,
			flag: MoveFlag.None // Uses standard capture/quiet flag configurations
		};
	}
}
