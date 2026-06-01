import { allOccupancy, FILE_B, FILE_C, FILE_D, FILE_F, FILE_G, RANK } from "@/app/utils/bitboardHelpers";
import {Color, Move, MoveFlag} from "@/app/utils/types";
import { GeneratorContext } from "@/app/generator/Generator";
import {MoveGeometry, GeometryResult, GeometryDetails} from "@/app/generator/geometries/MoveGeometry";
import {CannotCapture} from "@/app/generator/CannotCapture";

export class CastleGeometry extends CannotCapture<BaseCastleGeometry> {
	getGeom() {
		return new BaseCastleGeometry();
	}
}

class BaseCastleGeometry implements MoveGeometry {
	public getDetails(): GeometryDetails {
		return {
			name: "Castle",
			moveDesc: `towards the rooks on the home rank if castling rights are available and the path is clear`,
			captureDesc: ""
		}
	}

	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		let mask = 0n;
		const occupied = allOccupancy(ctx.board);
		const currentRankMask = RANK[fromSq >> 3];

		// King-side destination landing square index (e.g., fromSq + 2)
		if (ctx.castlingRights.kingSide && (occupied & currentRankMask & (FILE_F | FILE_G)) === 0n) {
			mask |= (1n << BigInt(fromSq + 2));
		}

		// Queen-side destination landing square index (e.g., fromSq - 2)
		if (ctx.castlingRights.queenSide && (occupied & currentRankMask & (FILE_B | FILE_C | FILE_D)) === 0n) {
			mask |= (1n << BigInt(fromSq - 2));
		}

		return {
			attackMask: mask,
			flag: MoveFlag.Castle
		};
	}
}
