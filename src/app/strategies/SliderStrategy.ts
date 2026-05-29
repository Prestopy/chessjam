import { allOccupancy, enemyOccupancy } from "@/app/utils/bitboardHelpers";
import { PieceStrategy } from "@/app/strategies/Strategy";
import { Color, Move } from "@/app/utils/types";
import { GeneratorContext } from "@/app/Generator";
import { not64 } from "@/app/utils/bitUtils";
import { addCaptureMoves, addMoves } from "@/app/Move";

export class SliderStrategy implements PieceStrategy {
	public captureMode?: boolean;

	constructor(private attackMaskFunc: (sq: number, occupied: bigint) => bigint) {}

	capturesOnly(): this {
		this.captureMode = true;
		return this;
	}

	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];
		const occupied = allOccupancy(ctx.board);

		// Sliding rays are calculated relative to the entire board's occupation layout
		const attacks = this.attackMaskFunc(fromSq, occupied);

		if (this.captureMode) {
			const enemy = enemyOccupancy(ctx.board, color);
			const filteredTargets = attacks & enemy;

			addCaptureMoves(moves, fromSq, filteredTargets, ctx.board);
		} else {
			const filteredTargets = attacks & not64(occupied);

			addMoves(moves, fromSq, filteredTargets);
		}

		return moves;
	}
}
