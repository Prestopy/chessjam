import { BasePushGeometry } from "./BasePushGeometry";
import { GeneratorContext } from "@/app/generator/Generator";
import { Color, MoveFlag } from "@/app/utils/types";
import { squareMask } from "@/app/utils/bitboardHelpers";
import {MoveGeometry, GeometryResult, GeometryDetails} from "@/app/generator/geometries/MoveGeometry";

export class SinglePushGeometry extends BasePushGeometry implements MoveGeometry {
	constructor() {
		super();
	}

	public getDetails(): GeometryDetails {
		return {
			name: "Single Push",
			moveDesc: "one square forward",
			captureDesc: "one square forward"
		}
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
