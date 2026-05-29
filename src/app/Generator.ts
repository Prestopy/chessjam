import {Board, Move, MoveHistoryEntry, Piece, PieceName} from "@/app/utils/types";
import {PieceStrategy} from "@/app/strategies/Strategy";
import {LeaperStrategy} from "@/app/strategies/LeaperStrategy";
import {getBishopAttacks, getKnightAttacks, getRookAttacks} from "@/app/strategies/attacks";
import {SliderStrategy} from "@/app/strategies/SliderStrategy";
import {pieceColor, pieceName} from "@/app/utils/utils";
import {AroundStrategy} from "@/app/strategies/AroundStrategy";
import {CastleStrategy} from "@/app/strategies/CastleStrategy";
import {SinglePushStrategy} from "@/app/strategies/SinglePushStrategy";
import {DoublePushStrategy} from "@/app/strategies/DoublePushStrategy";
import {StrategyModifier} from "@/app/strategies/StrategyModifier";
import {PromotionStrategy} from "@/app/strategies/PromotionStrategy";
import {DiagonalCaptureStrategy} from "@/app/strategies/DiagonalCaptureStrategy";
import {EnPassantStrategy} from "@/app/strategies/EnPassantStrategy";

export interface GeneratorContext {
	board: Board;
	moveHistory: MoveHistoryEntry[];
	castlingRights: {
		kingSide: boolean;
		queenSide: boolean;
	}
}

// TODO: separate class for move and captures (.capturesOnly() returns a CapturesOnly variant)
// TODO: En Passant will have the CapturesOnly variant only.
interface FullStrategy {
	move: PieceStrategy[];
	capture: PieceStrategy[];
	modifiers?: StrategyModifier[];
}

export class Generator {
	private strategies = new Map<PieceName, FullStrategy>();

	constructor() {
		// Register default rules setups
		this.strategies.set(PieceName.Pawn, {
			move: [
				new SinglePushStrategy(),
				new DoublePushStrategy({
					whiteDoublePushRank: 3,
					blackDoublePushRank: 4
				})],
			capture: [new DiagonalCaptureStrategy().capturesOnly(), new EnPassantStrategy().capturesOnly()],
			modifiers: [new PromotionStrategy()]
		});
		this.strategies.set(PieceName.Knight, {
			move: [new LeaperStrategy(getKnightAttacks)],
			capture: [new LeaperStrategy(getKnightAttacks).capturesOnly()],
		});
		this.strategies.set(PieceName.King, {
			move: [new AroundStrategy({ dist: 1}), new CastleStrategy()],
			capture: [new AroundStrategy({ dist: 1}).capturesOnly()],
		});
		this.strategies.set(PieceName.Rook, {
			move: [new SliderStrategy(getRookAttacks)],
			capture: [new SliderStrategy(getRookAttacks).capturesOnly()],
		});
		this.strategies.set(PieceName.Bishop, {
			move: [new SliderStrategy(getBishopAttacks)],
			capture: [new SliderStrategy(getBishopAttacks).capturesOnly()],
		});

		// Queen is just combined sliding lookups
		this.strategies.set(PieceName.Queen, {
			move: [new SliderStrategy((sq, occupied) => getRookAttacks(sq, occupied) | getBishopAttacks(sq, occupied))],
			capture: [new SliderStrategy((sq, occupied) => getRookAttacks(sq, occupied) | getBishopAttacks(sq, occupied)).capturesOnly()],
		});
	}

	/**
	 * Allows seamless customization out-of-the-box!
	 * Example: generator.overrideStrategy(PieceName.Pawn, new SuperPawnStrategy());
	 */
	public overrideStrategy(piece: PieceName, strategy: FullStrategy) {
		this.strategies.set(piece, strategy);
	}

	public generateMovesForPiece(piece: Piece, fromSq: number, ctx: GeneratorContext): Move[] {
		const strategy = this.strategies.get(pieceName(piece));
		if (!strategy) return [];

		const moves = strategy.move.reduce((acc, strat) => [...acc, ...strat.generate(fromSq, pieceColor(piece), ctx)], [] as Move[]);
		const captures = strategy.capture.reduce((acc, strat) => [...acc, ...strat.generate(fromSq, pieceColor(piece), ctx)], [] as Move[]);

		return [...moves, ...captures];
	}
}
