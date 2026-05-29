import { Color, MoveFlag } from "@/app/utils/types";
import { GeneratorContext } from "@/app/generator/Generator";
import { getPawnAttacks } from "@/app/generator/strategies/attacks";
import {MoveGeometry, GeometryResult, GeometryDetails} from "@/app/generator/geometries/MoveGeometry";

export class DiagonalGeometry implements MoveGeometry {
	public getDetails(): GeometryDetails {
		return {
			name: "Diagonal Step",
			moveDesc: "one square diagonally in the forward direction",
			captureDesc: "one square diagonally in the forward direction"
		}
	}

	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		// Retrieve the standard left/right diagonal step bitboard
		const attacks = getPawnAttacks(fromSq, color);

		return {
			attackMask: attacks,
			flag: MoveFlag.None // Uses standard capture/quiet flag configurations
		};
	}
}
