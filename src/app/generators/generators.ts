import {Board, Move, MoveHistoryEntry, Piece, PieceName} from "@/app/utils/types";
import {PieceStrategy} from "@/app/generators/Strategy";
import {PawnStrategy} from "@/app/generators/PawnStrategy";
import {LeaperStrategy} from "@/app/generators/LeaperStrategy";
import {getBishopAttacks, getKnightAttacks, getRookAttacks} from "@/app/generators/attacks";
import {KingStrategy} from "@/app/generators/KingStrategy";
import {SliderStrategy} from "@/app/generators/SliderStrategy";
import {pieceColor, pieceName} from "@/app/utils/utils";

export interface GeneratorContext {
	board: Board;
	moveHistory: MoveHistoryEntry[];
	castlingRights: {
		kingSide: boolean;
		queenSide: boolean;
	}
}

export class Generator {
	private strategies = new Map<PieceName, PieceStrategy>();

	constructor() {
		// Register default rules setups
		this.strategies.set(PieceName.Pawn, new PawnStrategy());
		this.strategies.set(PieceName.Knight, new LeaperStrategy(getKnightAttacks));
		this.strategies.set(PieceName.King, new KingStrategy());
		this.strategies.set(PieceName.Rook, new SliderStrategy(getRookAttacks));
		this.strategies.set(PieceName.Bishop, new SliderStrategy(getBishopAttacks));

		// Queen is just combined sliding lookups
		this.strategies.set(PieceName.Queen, new SliderStrategy((sq, occ) =>
			getRookAttacks(sq, occ) | getBishopAttacks(sq, occ)
		));
	}

	/**
	 * Allows seamless customization out-of-the-box!
	 * Example: generator.overrideStrategy(PieceName.Pawn, new SuperPawnStrategy());
	 */
	public overrideStrategy(piece: PieceName, strategy: PieceStrategy) {
		this.strategies.set(piece, strategy);
	}

	public generateMovesForPiece(piece: Piece, fromSq: number, ctx: GeneratorContext): Move[] {
		const strategy = this.strategies.get(pieceName(piece));
		if (!strategy) return [];
		return strategy.generate(fromSq, pieceColor(piece), ctx);
	}
}
