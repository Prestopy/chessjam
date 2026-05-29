import { Color, MoveFlag } from "@/app/utils/types";
import { GeneratorContext } from "@/app/generator/Generator";
import {MoveGeometry, GeometryResult, GeometryDetails} from "@/app/generator/geometries/MoveGeometry";

export class LeaperGeometry implements MoveGeometry {
	constructor(private attackMaskFunc: (sq: number) => bigint, private details: GeometryDetails) {}

	public getDetails(): GeometryDetails {
		return this.details;
	}

	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		// Retrieve the raw jumping/stepping destination bitboard mask for the piece
		const attacks = this.attackMaskFunc(fromSq);

		return {
			attackMask: attacks,
			flag: MoveFlag.None // Uses standard capture/quiet move configurations
		};
	}
}
