import {allOccupancy, enemyOccupancy} from "@/app/utils/bitboardHelpers";
import {PieceStrategy} from "@/app/generators/Strategy";
import {Color, Move} from "@/app/utils/types";
import {GeneratorContext} from "@/app/generators/generators";
import {not64} from "@/app/utils/bitUtils";
import {addCaptureMoves, addMoves} from "@/app/Move";

export class LeaperStrategy implements PieceStrategy {
	constructor(private attackMaskFunc: (sq: number) => bigint) {}

	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];
		const occupied = allOccupancy(ctx.board);
		const enemy = enemyOccupancy(ctx.board, color);
		const attacks = this.attackMaskFunc(fromSq);

		addMoves(moves, fromSq, attacks & not64(occupied));
		addCaptureMoves(moves, fromSq, attacks & enemy, ctx.board);
		return moves;
	}
}
