import {allOccupancy, enemyOccupancy, FILE_B, FILE_C, FILE_D, FILE_F, FILE_G, RANK} from "@/app/utils/bitboardHelpers";
import {PieceStrategy} from "@/app/generators/Strategy";
import {Color, Move, MoveFlag} from "@/app/utils/types";
import {GeneratorContext} from "@/app/generators/generators";
import {not64} from "@/app/utils/bitUtils";
import {addCaptureMoves, addMoves, makeMove} from "@/app/Move";
import {LeaperStrategy} from "@/app/generators/LeaperStrategy";
import {getKingAttacks} from "@/app/generators/attacks";

export class KingStrategy extends LeaperStrategy {
	constructor() {
		super(getKingAttacks);
	}

	override generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves = super.generate(fromSq, color, ctx);
		const occupied = allOccupancy(ctx.board);

		if (ctx.castlingRights.kingSide && (occupied & RANK[fromSq >> 3] & (FILE_F | FILE_G)) === 0n) {
			moves.push(makeMove(fromSq, fromSq + 2, MoveFlag.Castle));
		}
		if (ctx.castlingRights.queenSide && (occupied & RANK[fromSq >> 3] & (FILE_B | FILE_C | FILE_D)) === 0n) {
			moves.push(makeMove(fromSq, fromSq - 2, MoveFlag.Castle));
		}
		return moves;
	}
}
