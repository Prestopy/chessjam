import { BasePushGeometry } from "./BasePushGeometry";
import { GeneratorContext } from "@/app/generator/Generator";
import { Color, MoveFlag } from "@/app/utils/types";
import { allOccupancy, squareMask } from "@/app/utils/bitboardHelpers";
import {MoveGeometry, GeometryResult, GeometryDetails} from "@/app/generator/geometries/MoveGeometry";

export interface DoublePushConfig {
	whiteDoublePushRank: number; // Row index destination (e.g., 3 for Rank 4)
	blackDoublePushRank: number; // Row index destination (e.g., 4 for Rank 5)
}

export class DoublePushGeometry extends BasePushGeometry implements MoveGeometry {
	constructor(
		private doubleConfig: DoublePushConfig = {
			whiteDoublePushRank: 3,
			blackDoublePushRank: 4,
		}
	) {
		super();
	}

	public getDetails(): GeometryDetails {
		return {
			name: "Double Push",
			moveDesc: `two squares forward from rank ${this.doubleConfig.whiteDoublePushRank - 2 + 1} (white)/rank ${this.doubleConfig.blackDoublePushRank + 2 + 1} (black) if both squares are unoccupied`,
			captureDesc: `two squares forward from rank ${this.doubleConfig.whiteDoublePushRank - 2 + 1} (white)/rank ${this.doubleConfig.blackDoublePushRank + 2 + 1} (black) if both squares are unoccupied`,
		}
	}

	public getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult {
		const currentRank = fromSq >> 3;

		// Verify the piece is sitting exactly 2 steps away from its valid target rank
		const isInitialWhiteRank = color === Color.White && currentRank === (this.doubleConfig.whiteDoublePushRank - 2);
		const isInitialBlackRank = color === Color.Black && currentRank === (this.doubleConfig.blackDoublePushRank + 2);

		// Return empty geometry if not on a valid initial rank setup
		if (!isInitialWhiteRank && !isInitialBlackRank) {
			return { attackMask: 0n, flag: MoveFlag.DoublePush };
		}

		const pawnBitboard = squareMask(fromSq);
		const occupied = allOccupancy(ctx.board);

		// Path validation: The intermediate square must be completely clear to pass through
		const pathSquare = this.shiftForward(pawnBitboard, color, 1);
		if ((pathSquare & occupied) !== 0n) {
			return { attackMask: 0n, flag: MoveFlag.DoublePush }; // Path is blocked
		}

		// Project target landing zone 2 squares away
		const targetSquare = this.shiftForward(pawnBitboard, color, 2);

		return {
			attackMask: targetSquare,
			flag: MoveFlag.DoublePush
		};
	}
}
