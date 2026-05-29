import { allOccupancy, enemyOccupancy } from "@/app/utils/bitboardHelpers";
import { PieceStrategy } from "@/app/strategies/Strategy";
import { Color, Move } from "@/app/utils/types";
import { GeneratorContext } from "@/app/Generator";
import { getPawnAttacks } from "@/app/strategies/attacks";
import { not64 } from "@/app/utils/bitUtils";
import { addCaptureMoves, addMoves } from "@/app/Move";

export interface DiagonalConfig {
	allowQuietDiagonal: boolean; // If true, can step into empty squares diagonally
}

export class DiagonalCaptureStrategy implements PieceStrategy {
	public captureMode?: boolean;

	constructor(private config: DiagonalConfig = { allowQuietDiagonal: false }) {}

	capturesOnly(): this {
		this.captureMode = true;
		return this;
	}

	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];
		const attacks = getPawnAttacks(fromSq, color);

		if (this.captureMode) {
			const enemy = enemyOccupancy(ctx.board, color);
			const filteredTargets = attacks & enemy;

			addCaptureMoves(moves, fromSq, filteredTargets, ctx.board);
		} else if (this.config.allowQuietDiagonal) {
			const occupied = allOccupancy(ctx.board);
			const filteredTargets = attacks & not64(occupied);

			addMoves(moves, fromSq, filteredTargets);
		}

		return moves;
	}
}
