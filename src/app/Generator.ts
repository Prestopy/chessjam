import { Board, Move, MoveHistoryEntry, Piece, PieceName } from "@/app/utils/types";
import { getBishopAttacks, getKnightAttacks, getRookAttacks } from "@/app/strategies/attacks";
import { pieceColor, pieceName } from "@/app/utils/utils";

// Import Geometry Layer
import { AroundGeometry } from "@/app/geometries/AroundGeometry";
import { CastleGeometry } from "@/app/geometries/CastleGeometry";
import { DiagonalGeometry } from "@/app/geometries/DiagonalGeometry";
import { EnPassantGeometry } from "@/app/geometries/EnPassantGeometry";
import { LeaperGeometry } from "@/app/geometries/LeaperGeometry";
import { SinglePushGeometry } from "@/app/geometries/SinglePushGeometry";
import { DoublePushGeometry } from "@/app/geometries/DoublePushGeometry";
import { SliderGeometry } from "@/app/geometries/SliderGeometry";

// Import Unified Strategy Execution Layer
import { QuietStrategy } from "@/app/strategies/QuietStrategy";
import { CaptureStrategy } from "@/app/strategies/CaptureStrategy";
import {StrategyModifier} from "@/app/modifiers/StrategyModifier";

export interface GeneratorContext {
	board: Board;
	moveHistory: MoveHistoryEntry[];
	castlingRights: {
		kingSide: boolean;
		queenSide: boolean;
	};
}

interface FullStrategy {
	move: QuietStrategy[];
	capture: CaptureStrategy[];
	modifiers?: StrategyModifier[];
}

export class Generator {
	private strategies = new Map<PieceName, FullStrategy>();

	constructor() {
		// --- PAWN RULES SETUP ---
		this.strategies.set(PieceName.Pawn, {
			move: [
				new QuietStrategy(new SinglePushGeometry()),
				new QuietStrategy(new DoublePushGeometry())
			],
			capture: [
				new CaptureStrategy(new DiagonalGeometry()),
				new CaptureStrategy(new EnPassantGeometry())
			],
			modifiers: [] // Can push a PromotionModifier instance here if available
		});

		// --- KNIGHT RULES SETUP ---
		const knightGeom = new LeaperGeometry(getKnightAttacks);
		this.strategies.set(PieceName.Knight, {
			move: [new QuietStrategy(knightGeom)],
			capture: [new CaptureStrategy(knightGeom)],
		});

		// --- KING RULES SETUP ---
		const kingGeom = new AroundGeometry({ dist: 1 });
		this.strategies.set(PieceName.King, {
			move: [
				new QuietStrategy(kingGeom),
				new QuietStrategy(new CastleGeometry()) // Castling is fundamentally a unique quiet move
			],
			capture: [new CaptureStrategy(kingGeom)],
		});

		// --- ROOK RULES SETUP ---
		const rookGeom = new SliderGeometry(getRookAttacks);
		this.strategies.set(PieceName.Rook, {
			move: [new QuietStrategy(rookGeom)],
			capture: [new CaptureStrategy(rookGeom)],
		});

		// --- BISHOP RULES SETUP ---
		const bishopGeom = new SliderGeometry(getBishopAttacks);
		this.strategies.set(PieceName.Bishop, {
			move: [new QuietStrategy(bishopGeom)],
			capture: [new CaptureStrategy(bishopGeom)],
		});

		// --- QUEEN RULES SETUP ---
		const queenGeom = new SliderGeometry((sq, occupied) =>
			getRookAttacks(sq, occupied) | getBishopAttacks(sq, occupied)
		);
		this.strategies.set(PieceName.Queen, {
			move: [new QuietStrategy(queenGeom)],
			capture: [new CaptureStrategy(queenGeom)],
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

		const color = pieceColor(piece);

		// 1. Gather all quiet options via standard quiet pipelines
		const moves = strategy.move.reduce(
			(acc, strat) => [...acc, ...strat.generateQuiet(fromSq, color, ctx)],
			[] as Move[]
		);

		// 2. Gather all capture possibilities via capturing pipelines
		const captures = strategy.capture.reduce(
			(acc, strat) => [...acc, ...strat.generateCaptures(fromSq, color, ctx)],
			[] as Move[]
		);

		// Combine positional moves and captures
		let totalMoves = [...moves, ...captures];

		// 3. Post-process via any assigned execution interceptor modifiers (like Promotions)
		if (strategy.modifiers) {
			for (const modifier of strategy.modifiers) {
				totalMoves = modifier.apply(totalMoves, color);
			}
		}

		return totalMoves;
	}
}
