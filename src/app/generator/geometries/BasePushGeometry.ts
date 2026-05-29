import {GeometryDetails, GeometryResult, MoveGeometry} from "@/app/generator/geometries/MoveGeometry";
import { Color } from "@/app/utils/types";
import { u64 } from "@/app/utils/bitUtils";
import {GeneratorContext} from "@/app/generator/Generator";

export abstract class BasePushGeometry implements MoveGeometry {
	constructor() {}

	public abstract getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult;
	public abstract getDetails(): GeometryDetails;

	/**
	 * Shifts a bitboard mask forward relative to the player's color
	 */
	protected shiftForward(mask: bigint, color: Color, steps: number): bigint {
		let result = mask;
		for (let i = 0; i < steps; i++) {
			result = color === Color.White ? u64(result << 8n) : u64(result >> 8n);
		}
		return result;
	}
}
