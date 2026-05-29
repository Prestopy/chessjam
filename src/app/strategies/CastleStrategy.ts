import { allOccupancy, FILE_B, FILE_C, FILE_D, FILE_F, FILE_G, RANK } from "@/app/utils/bitboardHelpers";
import { PieceStrategy } from "@/app/strategies/Strategy";
import { Color, Move, MoveFlag } from "@/app/utils/types";
import { GeneratorContext } from "@/app/Generator";
import { makeMove } from "@/app/Move";

export class CastleStrategy implements PieceStrategy {
	public captureMode?: boolean;

	/**
	 * Fluent configuration chain modifier.
	 * Note: Castling is structurally a non-capturing special move. If called,
	 * this will prevent any moves from being returned when in captureMode.
	 */
	capturesOnly(): this {
		this.captureMode = true;
		return this;
	}

	// TODO: Check that the squares it passes thru are not in check and that the king is not as well
	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];

		// Castling moves are fundamentally quiet positioning maneuvers and never capture.
		if (this.captureMode) {
			return moves;
		}

		const occupied = allOccupancy(ctx.board);
		const currentRankMask = RANK[fromSq >> 3];

		// King-side castling assessment (F and G files must be empty)
		if (ctx.castlingRights.kingSide && (occupied & currentRankMask & (FILE_F | FILE_G)) === 0n) {
			moves.push(makeMove(fromSq, fromSq + 2, MoveFlag.Castle));
		}

		// Queen-side castling assessment (B, C, and D files must be empty)
		if (ctx.castlingRights.queenSide && (occupied & currentRankMask & (FILE_B | FILE_C | FILE_D)) === 0n) {
			moves.push(makeMove(fromSq, fromSq - 2, MoveFlag.Castle));
		}

		return moves;
	}
}
