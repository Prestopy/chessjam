import {NOT_A_FILE, NOT_H_FILE, squareMask} from "@/app/utils/bitboardHelpers";
import {Color, MoveFlag} from "@/app/utils/types";
import {GeneratorContext} from "@/app/generator/Generator";
import {GeometryDetails, GeometryResult, MoveGeometry} from "@/app/generator/geometries/MoveGeometry";

interface AroundConfig {
	dist: number;
}

export class AroundGeometry implements MoveGeometry {
	public captureMode?: boolean;

	constructor(private config: AroundConfig = { dist: 1 }) {}

	public getDetails(): GeometryDetails {
		return {
			name: "Around",
			moveDesc: `freely on a ${this.config.dist*2+1}x${this.config.dist*2+1} square around the piece`,
			captureDesc: `any enemy on a ${this.config.dist*2+1}x${this.config.dist*2+1} square around the piece`
		}
	}

	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		// 1. Expand horizontally first to create a row of bits
		let mask = squareMask(fromSq);
		for (let i = 0; i < this.config.dist; i++) {
			mask |= (mask & NOT_H_FILE) >> 1n; // shift west
			mask |= (mask & NOT_A_FILE) << 1n; // shift east
		}

		// 2. Expand that entire row vertically to form the full square grid layout
		for (let i = 0; i < this.config.dist; i++) {
			mask |= mask >> 8n; // shift north
			mask |= mask << 8n; // shift south
		}

		// 3. Mask out the starting square so the piece cannot move to its current position
		mask &= ~squareMask(fromSq);

		return {
			attackMask: mask,
			flag: MoveFlag.None
		};
	}
}
