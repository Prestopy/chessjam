import { allOccupancy, enemyOccupancy, NOT_A_FILE, NOT_H_FILE, squareMask } from "@/app/utils/bitboardHelpers";
import { PieceStrategy } from "@/app/strategies/Strategy";
import { Color, Move } from "@/app/utils/types";
import { GeneratorContext } from "@/app/Generator";
import { not64 } from "@/app/utils/bitUtils";
import { addCaptureMoves, addMoves } from "@/app/Move";

interface AroundConfig {
	dist: number;
}

export class AroundStrategy implements PieceStrategy {
	public captureMode?: boolean;

	constructor(private config: AroundConfig = { dist: 1 }) {}

	capturesOnly(): this {
		this.captureMode = true;
		return this;
	}

	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];

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

		// 4. Filter targets using your standard context routines
		if (this.captureMode) {
			const enemy = enemyOccupancy(ctx.board, color);
			const filteredTargets = mask & enemy;

			addCaptureMoves(moves, fromSq, filteredTargets, ctx.board);
		} else {
			const occupied = allOccupancy(ctx.board);
			const filteredTargets = mask & not64(occupied);

			addMoves(moves, fromSq, filteredTargets);
		}

		return moves;
	}
}
