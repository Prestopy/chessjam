import { PieceStrategy } from "@/app/strategies/Strategy";
import { GeneratorContext } from "@/app/Generator";
import { Color, Move } from "@/app/utils/types";
import { enemyOccupancy, allOccupancy } from "@/app/utils/bitboardHelpers";
import { not64 } from "@/app/utils/bitUtils";
import { addCaptureMoves, addMoves } from "@/app/Move";

export class LeaperStrategy implements PieceStrategy {
	// Implement the interface property
	public captureMode?: boolean;

	constructor(private attackMaskFunc: (sq: number) => bigint) {}

	/**
	 * Fluent configuration chain modifier to set this strategy instance
	 * to capture-only mode before move evaluation execution.
	 */
	capturesOnly(): this {
		this.captureMode = true;
		return this;
	}

	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];

		// Retrieve standard attack mask for this relative piece type (e.g., Knight or King steps)
		const attacks = this.attackMaskFunc(fromSq);

		if (this.captureMode) {
			// Filter targets down strictly to cells occupied by enemy pieces
			const enemy = enemyOccupancy(ctx.board, color);
			const filteredTargets = attacks & enemy;

			addCaptureMoves(moves, fromSq, filteredTargets, ctx.board);
		} else {
			// Quiet moves: filter targets down strictly to empty cells
			const occupied = allOccupancy(ctx.board);
			const filteredTargets = attacks & not64(occupied);

			addMoves(moves, fromSq, filteredTargets);
		}

		return moves;
	}
}
