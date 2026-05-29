import {GeneratorContext} from "@/app/Generator";
import {Color, Move} from "@/app/utils/types";

export interface PieceStrategy {
	/**
	 * Property to indicate if this strategy is for generating capture moves.
	 * If true, the generator will only consider moves that capture an opponent's piece.
	 * If false or undefined, the generator will only consider non-capturing moves.
	 */
	captureMode?: boolean;

	/**
	 * Sets the strategy to only generate capture moves.
	 * This method can be called to configure the strategy before generating moves.
	 */
	capturesOnly(): this;

	/**
	 * Generates moves for a piece from a given square, considering the piece's color and the current game context.
	 * @param fromSq
	 * @param color
	 * @param ctx
	 */
	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[];
}
