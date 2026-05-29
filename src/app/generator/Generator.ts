import { Board, Move, MoveHistoryEntry, Piece, PieceName } from "@/app/utils/types";
import { getBishopAttacks, getKnightAttacks, getRookAttacks } from "@/app/generator/strategies/attacks";
import { pieceColor, pieceName } from "@/app/utils/utils";

// Import Geometry Layer
import { AroundGeometry } from "@/app/generator/geometries/AroundGeometry";
import { CastleGeometry } from "@/app/generator/geometries/CastleGeometry";
import { DiagonalGeometry } from "@/app/generator/geometries/DiagonalGeometry";
import { EnPassantGeometry } from "@/app/generator/geometries/EnPassantGeometry";
import { LeaperGeometry } from "@/app/generator/geometries/LeaperGeometry";
import { SinglePushGeometry } from "@/app/generator/geometries/SinglePushGeometry";
import { DoublePushGeometry } from "@/app/generator/geometries/DoublePushGeometry";
import { SliderGeometry } from "@/app/generator/geometries/SliderGeometry";

// Import Unified Strategy Execution Layer
import { QuietStrategy } from "@/app/generator/strategies/QuietStrategy";
import { CaptureStrategy } from "@/app/generator/strategies/CaptureStrategy";
import {StrategyModifier} from "@/app/generator/modifiers/StrategyModifier";
import {PromotionModifier} from "@/app/generator/modifiers/PromotionModifier";
import {GEOMETRY_POOL, MODIFIER_POOL} from "@/app/generator/pools";
import {MoveGeometry} from "@/app/generator/geometries/MoveGeometry";

export interface GeneratorContext {
	board: Board;
	moveHistory: MoveHistoryEntry[];
	castlingRights: {
		kingSide: boolean;
		queenSide: boolean;
	};
}

export interface FullStrategy {
	move: QuietStrategy[];
	capture: CaptureStrategy[];
	modifiers?: StrategyModifier[];
}

export interface RandomRuleOptions {
	sameMoveAndCaptureGeometryChance: number; // Chance that move and capture geometries are the same for a piece
	modifierChance: number; // Base chance that a random modifier is added to a piece's strategy
	multiGeometryChance: number; // Chance to roll an additional geometry (e.g., 0.3 for a 30% chance for a second, third, etc.)
	multiModifierChance: number; // Chance to roll additional modifiers
}

export class Generator {
	private strategies = new Map<PieceName, FullStrategy>();

	constructor(strats: Map<PieceName, FullStrategy>) {
		this.strategies = strats;
	}

	/**
	 * Allows seamless customization out-of-the-box!
	 * Example: generator.overrideStrategy(PieceName.Pawn, new SuperPawnStrategy());
	 */
	public overrideStrategy(piece: PieceName, strategy: FullStrategy) {
		this.strategies.set(piece, strategy);
	}

	/**
	 * Retrieves the full strategy configuration for all pieces. Useful for debugging or advanced use cases where
	 */
	public getAllStrategies(): Map<PieceName, FullStrategy> {
		return this.strategies;
	}

	/**
	 * Core method to generate all legal moves for a given piece on a specific square, based on the assigned strategies.
	 * @param piece
	 * @param fromSq
	 * @param ctx
	 */
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

	/**
	 * Factory method to create a generator pre-populated with standard chess rules.
	 */
	public static standardRules(): Generator {
		const generator = new this(new Map());
		// --- PAWN RULES SETUP ---
		generator.overrideStrategy(PieceName.Pawn, {
			move: [
				new QuietStrategy(new SinglePushGeometry()),
				new QuietStrategy(new DoublePushGeometry())
			],
			capture: [
				new CaptureStrategy(new DiagonalGeometry()),
				new CaptureStrategy(new EnPassantGeometry())
			],
			modifiers: [new PromotionModifier()]
		});

		// --- KNIGHT RULES SETUP ---
		const knightGeom = new LeaperGeometry(getKnightAttacks, {
			name: "Knight Leaps",
			moveDesc: "according to standard knight jumps",
			captureDesc: "according to standard knight jumps"
		});
		generator.overrideStrategy(PieceName.Knight, {
			move: [new QuietStrategy(knightGeom)],
			capture: [new CaptureStrategy(knightGeom)],
		});

		// --- KING RULES SETUP ---
		const kingGeom = new AroundGeometry({ dist: 1 });
		generator.overrideStrategy(PieceName.King, {
			move: [
				new QuietStrategy(kingGeom),
				new QuietStrategy(new CastleGeometry()) // Castling is fundamentally a unique quiet move
			],
			capture: [new CaptureStrategy(kingGeom)],
		});

		// --- ROOK RULES SETUP ---
		const rookGeom = new SliderGeometry(getRookAttacks, {
			name: "Rook Sliders",
			moveDesc: "along ranks and files",
			captureDesc: "along ranks and files"
		});
		generator.overrideStrategy(PieceName.Rook, {
			move: [new QuietStrategy(rookGeom)],
			capture: [new CaptureStrategy(rookGeom)],
		});

		// --- BISHOP RULES SETUP ---
		const bishopGeom = new SliderGeometry(getBishopAttacks, {
			name: "Bishop Sliders",
			moveDesc: "along diagonals",
			captureDesc: "along diagonals"
		});
		generator.overrideStrategy(PieceName.Bishop, {
			move: [new QuietStrategy(bishopGeom)],
			capture: [new CaptureStrategy(bishopGeom)],
		});

		// --- QUEEN RULES SETUP ---
		const queenGeom = new SliderGeometry((sq, occupied) => (
			getRookAttacks(sq, occupied) | getBishopAttacks(sq, occupied)
		), {
			name: "Queen Sliders",
			moveDesc: "along ranks, files, and diagonals",
			captureDesc: "along ranks, files, and diagonals"
		});
		generator.overrideStrategy(PieceName.Queen, {
			move: [new QuietStrategy(queenGeom)],
			capture: [new CaptureStrategy(queenGeom)],
		});

		return generator;
	}

	private static rollUniquePool<T>(
		pool: (() => T)[],
		baseChance: number,
		loopChance: number,
		isDuplicate: (existing: T[], next: T) => boolean
	): T[] {
		const results: T[] = [];

		// Loop continuously as long as the random chance hits and we haven't maxed out the pool
		while (results.length < pool.length && Math.random() < (results.length === 0 ? baseChance : loopChance)) {
			const item = pool[Math.floor(Math.random() * pool.length)]();

			if (!isDuplicate(results, item)) {
				results.push(item);
			}
		}
		return results;
	}

	public static randomizedRules(options: RandomRuleOptions): Generator {
		const generator = new this(new Map());
		const pieces = [PieceName.Pawn, PieceName.Knight, PieceName.Bishop, PieceName.Rook, PieceName.Queen, PieceName.King];

		// Unique checker for geometries based on your .getDetails().name mapping
		const isDuplicateGeom = (existing: MoveGeometry[], next: MoveGeometry) =>
			existing.some(g => g.getDetails().name === next.getDetails().name);

		// Unique checker for modifiers based on prototype constructor comparison
		const isDuplicateMod = (existing: StrategyModifier[], next: StrategyModifier) =>
			existing.some(m => m.constructor.name === next.constructor.name);

		for (const piece of pieces) {
			const forceSameCaptureAndMove = Math.random() < options.sameMoveAndCaptureGeometryChance;

			// 1. Roll all modifiers for this piece
			const modifiers = this.rollUniquePool(MODIFIER_POOL, options.modifierChance, options.multiModifierChance, isDuplicateMod);

			if (forceSameCaptureAndMove) {
				// Roll a stack of unique geometries to apply to BOTH move and capture arrays
				const sharedGeoms = this.rollUniquePool(GEOMETRY_POOL, 1.0, options.multiGeometryChance, isDuplicateGeom);

				generator.overrideStrategy(piece, {
					move: sharedGeoms.map(geom => new QuietStrategy(geom)),
					capture: sharedGeoms.map(geom => new CaptureStrategy(geom)),
					modifiers: modifiers.length > 0 ? modifiers : undefined
				});
			} else {
				// Roll distinct stacks of unique geometries for moves vs captures separately
				const moveGeoms = this.rollUniquePool(GEOMETRY_POOL, 1.0, options.multiGeometryChance, isDuplicateGeom);
				const captureGeoms = this.rollUniquePool(GEOMETRY_POOL, 1.0, options.multiGeometryChance, isDuplicateGeom);

				generator.overrideStrategy(piece, {
					move: moveGeoms.map(geom => new QuietStrategy(geom)),
					capture: captureGeoms.map(geom => new CaptureStrategy(geom)),
					modifiers: modifiers.length > 0 ? modifiers : undefined
				});
			}
		}

		return generator;
	}
}
