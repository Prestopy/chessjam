import { PieceStrategy } from "@/app/strategies/Strategy";
import { Color, Move, MoveFlag, PieceName } from "@/app/utils/types";
import { GeneratorContext } from "@/app/Generator";
import { isDoublePushMove, makeMove, moveToSq } from "@/app/Move";
import { makePiece, swapColor } from "@/app/utils/utils";

export class EnPassantStrategy implements PieceStrategy {
	public captureMode?: boolean;

	capturesOnly(): this {
		this.captureMode = true;
		return this;
	}

	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[] {
		const moves: Move[] = [];

		// En Passant is always a capture. Skip if we are explicitly looking for quiet moves.
		if (this.captureMode === false) {
			return moves;
		}

		if (ctx.moveHistory.length === 0) return moves;

		const enemyPrevMove = ctx.moveHistory.at(-1)!;
		if (isDoublePushMove(enemyPrevMove.move)) {
			const enemyPawnSq = moveToSq(enemyPrevMove.move);
			const enemyRow = enemyPawnSq >> 3;
			const enemyCol = enemyPawnSq & 7;
			const myRow = fromSq >> 3;
			const myCol = fromSq & 7;

			if (myRow === enemyRow && Math.abs(myCol - enemyCol) === 1) {
				const epTargetSq = enemyPawnSq + (color === Color.White ? 8 : -8);
				// Flagged explicitly as an En Passant capture matrix
				moves.push(makeMove(
					fromSq,
					epTargetSq,
					MoveFlag.EnPassant,
					makePiece(PieceName.Pawn, swapColor(color))
				));
			}
		}

		return moves;
	}
}
