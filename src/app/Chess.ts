import {GameDetails, GameState, MoveHistoryEntry, standardChessSetup, swapColor} from "@/app/utils";
import {
	generatePseudoBishopMoves,
	generatePseudoKingMoves,
	generatePseudoKnightMoves,
	generatePseudoPawnMoves,
	generatePseudoRookMoves,
	GeneratorContext,
} from "@/app/validators";
import {
	Board,
	Color, colorOccupancy,
	lsb,
	makeEmptyBoard,
	makePiece,
	Move,
	Piece,
	pieceColor,
	PieceName,
	pieceName,
	popcount,
	squareIndex,
	squareMask, u64,
} from "@/app/bitboardHelpers";
import {
	disectMove,
	isCaptureMove,
	isCastleMove,
	isEnPassantMove,
	isPromotionMove, moveCaptured,
	movePromotion,
	moveToCol,
	moveToRow, moveToSq
} from "@/app/Move";

// --- Board read/write ---

/**
 * Returns the Piece enum value on a given square, or null if empty.
 */
export function getBoardSquare(board: Board, sq: number): Piece | null {
	const mask = squareMask(sq);
	for (let p = 0; p < 12; p++) {
		if (board[p] & mask) return p as Piece;
	}
	return null;
}

/**
 * Clears all pieces from a square.
 */
function clearSquare(board: Board, sq: number): void {
	const mask = squareMask(sq);
	for (let p = 0; p < 12; p++) {
		board[p] = u64(board[p] & u64(~mask));
	}
}

/**
 * Sets a square to a piece (clearing whatever was there first).
 */
function setSquare(board: Board, sq: number, piece: Piece | null): void {
	clearSquare(board, sq);
	if (piece !== null) {
		board[piece] |= squareMask(sq);
	}
}

export class Chess {
	private board: Board;
	private numRanks: number;
	private numFiles: number;
	private moveHistory: MoveHistoryEntry[];
	private gameDetails: GameDetails;
	private materialScore: number = 0; // positive = white advantage

	private static readonly PIECE_VALUE: Record<PieceName, number> = {
		[PieceName.Pawn]:   100,
		[PieceName.Knight]: 320,
		[PieceName.Bishop]: 330,
		[PieceName.Rook]:   500,
		[PieceName.Queen]:  900,
		[PieceName.King]:   0,
	};

	private kingSideCastleRights:  { [key in Color]: boolean } = { [Color.White]: true,  [Color.Black]: true };
	private queenSideCastleRights: { [key in Color]: boolean } = { [Color.White]: true,  [Color.Black]: true };

	private currentTurn: Color = Color.White;

	constructor(ranks: number, files: number, board?: Board) {
		this.numRanks = ranks;
		this.numFiles = files;
		this.board = board ?? this.generateBoard(ranks, files);
		this.moveHistory = [];
		this.currentTurn = Color.White;
		this.gameDetails = { state: GameState.Running, winner: null };
		this.materialScore = this.computeMaterialScore();
	}

	// GETTERS #########################################################################################################

	getBoard(): Board {
		return new BigInt64Array(this.board) as Board;
	}

	getSquare(row: number, col: number): Piece | null {
		if (row < 0 || row >= this.numRanks || col < 0 || col >= this.numFiles) return null;
		return getBoardSquare(this.board, squareIndex(row, col));
	}

	getRanks(): number { return this.numRanks; }
	getFiles(): number { return this.numFiles; }
	getHistory() { return [...this.moveHistory]; }
	getTurn(): Color { return this.currentTurn; }
	getGameDetails(): GameDetails { return this.gameDetails; }

	// SETTERS #########################################################################################################

	nextTurn(): Chess {
		this.currentTurn = this.currentTurn === Color.White ? Color.Black : Color.White;
		return this;
	}

	setBoard(b: Board): void {
		this.board = b;
		this.materialScore = this.computeMaterialScore();
	}

	setSquare(row: number, col: number, piece: Piece | null): void {
		if (row < 0 || row >= this.numRanks || col < 0 || col >= this.numFiles) return;

		// Update material score incrementally
		const existing = getBoardSquare(this.board, squareIndex(row, col));
		if (existing !== null) this.adjustMaterial(existing, -1);
		if (piece  !== null) this.adjustMaterial(piece,    +1);

		setSquare(this.board, squareIndex(row, col), piece);
	}

	addHistoryEntry(entry: MoveHistoryEntry): void {
		this.moveHistory.push(entry);
	}

	// MATERIAL ########################################################################################################

	private adjustMaterial(piece: Piece, sign: 1 | -1): void {
		const value = Chess.PIECE_VALUE[pieceName(piece)];
		this.materialScore += sign * (pieceColor(piece) === Color.White ? value : -value);
	}

	private computeMaterialScore(): number {
		let score = 0;
		for (let p = 0; p < 12; p++) {
			const value = Chess.PIECE_VALUE[pieceName(p as Piece)];
			const sign  = pieceColor(p as Piece) === Color.White ? 1 : -1;
			score += sign * value * popcount(this.board[p]);
		}
		return score;
	}

	countPoints(color: Color): number {
		// Return the absolute material total for one side (no sign)
		let score = 0;
		const base = color * 6;
		for (let i = 0; i < 6; i++) {
			score += Chess.PIECE_VALUE[i as PieceName] * popcount(this.board[base + i]);
		}
		return score;
	}

	// CHESS FUNCTIONS #################################################################################################

	move(move: Move): { ok: true; enrichedMove: Move } | { ok: false } {
		const { fromRow, fromCol, toRow, toCol } = disectMove(move);

		if (
			fromRow === toRow && fromCol === toCol ||
			fromRow < 0 || fromRow >= this.numRanks ||
			fromCol < 0 || fromCol >= this.numFiles ||
			this.getSquare(fromRow, fromCol) === null
		) return { ok: false };

		const movingPiece = this.getSquare(fromRow, fromCol)!;
		if (pieceColor(movingPiece) !== this.currentTurn) return { ok: false };

		const moveValidation = this.validateMove(move, true);
		if (!moveValidation.valid) return { ok: false };

		const capturedPieceBefore = this.getSquare(toRow, toCol);
		const enrichedMove = moveValidation.enrichedMove;
		this.makeMove(enrichedMove);
		this.addHistoryEntry({ move: enrichedMove, piece: movingPiece });

		// Update castling rights
		const mName = pieceName(movingPiece);
		const mColor = pieceColor(movingPiece);
		if (mName === PieceName.King) {
			this.kingSideCastleRights[mColor]  = false;
			this.queenSideCastleRights[mColor] = false;
		} else if (mName === PieceName.Rook) {
			if (fromCol === 0)                 this.queenSideCastleRights[mColor] = false;
			else if (fromCol === this.numFiles - 1) this.kingSideCastleRights[mColor] = false;
		} else if (isCaptureMove(enrichedMove) && capturedPieceBefore !== null) {
			if (pieceName(capturedPieceBefore) === PieceName.Rook) {
				const capColor = pieceColor(capturedPieceBefore);
				if (toCol === 0)                      this.queenSideCastleRights[capColor] = false;
				else if (toCol === this.numFiles - 1) this.kingSideCastleRights[capColor]  = false;
			}
		}

		const opponentColor = swapColor(mColor);
		const mateState = this.isMate(opponentColor);
		if (mateState !== GameState.Running) {
			this.gameDetails.state  = mateState;
			this.gameDetails.winner = mateState === GameState.Checkmate ? mColor : null;
		} else if (this.checkInsufficientMaterial()) {
			this.gameDetails.state  = GameState.Draw;
			this.gameDetails.winner = null;
		}

		return { ok: true, enrichedMove };
	}

	makeMove(move: Move): { ok: boolean } {
		const { fromRow, fromCol, toRow, toCol } = disectMove(move);

		const movingPiece = this.getSquare(fromRow, fromCol);
		if (movingPiece === null) return { ok: false };

		// 1. Handle special board wipes before placing the moving piece
		if (isEnPassantMove(move)) {
			// A White pawn captures moving "up" (increasing rows), so the victim is 1 row behind the landing square
			const victimRow = pieceColor(movingPiece) === Color.White ? toRow - 1 : toRow + 1;
			this.setSquare(victimRow, toCol, null);
		}
		else if (isCastleMove(move)) {
			if (toCol === fromCol + 2) {
				// King-side
				const rook = this.getSquare(fromRow, this.numFiles - 1);
				if (rook !== null && pieceName(rook) === PieceName.Rook && pieceColor(rook) === pieceColor(movingPiece)) {
					this.setSquare(fromRow, fromCol + 1, rook);
					this.setSquare(fromRow, this.numFiles - 1, null);
				}
			} else if (toCol === fromCol - 2) {
				// Queen-side
				const rook = this.getSquare(fromRow, 0);
				if (rook !== null && pieceName(rook) === PieceName.Rook && pieceColor(rook) === pieceColor(movingPiece)) {
					this.setSquare(fromRow, fromCol - 1, rook);
					this.setSquare(fromRow, 0, null);
				}
			}
		}

		// 2. Resolve destination piece placement (Handles standard moves, promotions, and captures cleanly)
		if (isPromotionMove(move)) {
			this.setSquare(toRow, toCol, movePromotion(move));
		} else {
			this.setSquare(toRow, toCol, movingPiece);
		}

		// 3. Always clear the origin square
		this.setSquare(fromRow, fromCol, null);
		return { ok: true };
	}

	// TODO: does this restore castling rights?
	// FIXME: There are bugs where some positions can't be unmoved properly
	// probably special moves. Check that move generators apply all necessary flags
	unmakeMove(move: Move): void {
		const { fromRow, fromCol, toRow, toCol } = disectMove(move);

		let movingPiece = this.getSquare(toRow, toCol);
		if (movingPiece === null) {
			throw new Error(`No piece to unmove at [${toRow}, ${toCol}] from move: ${move}. Board: ${JSON.stringify(this.board)}`);
		}

		this.nextTurn(); // Toggle the active color flag back

		// 1. Reset the moving piece back to its original pawn state if it was promoted
		if (isPromotionMove(move)) {
			movingPiece = makePiece(PieceName.Pawn, pieceColor(movingPiece));
		}

		this.setSquare(fromRow, fromCol, movingPiece);
		this.setSquare(toRow, toCol, null); // Clear the landing pad by default

		// 2. Restore captured pieces onto their exact locations
		if (isEnPassantMove(move)) {
			// Exact match calculation: White pawn moving up captured a piece 1 row below the target square
			const victimRow = pieceColor(movingPiece) === Color.White ? toRow - 1 : toRow + 1;
			this.setSquare(victimRow, toCol, makePiece(PieceName.Pawn, swapColor(pieceColor(movingPiece))));
		}
		else if (isCaptureMove(move)) {
			const captured = moveCaptured(move);
			if (captured !== null) {
				this.setSquare(toRow, toCol, captured); // Put captured piece back safely
			}
		}

		// 3. Restore Castling Rook positions back to corners
		if (isCastleMove(move)) {
			if (toCol === fromCol + 2) {
				// King-side
				this.setSquare(fromRow, fromCol + 1, null);
				this.setSquare(fromRow, this.numFiles - 1, makePiece(PieceName.Rook, pieceColor(movingPiece)));
			} else if (toCol === fromCol - 2) {
				// Queen-side
				this.setSquare(fromRow, fromCol - 1, null);
				this.setSquare(fromRow, 0, makePiece(PieceName.Rook, pieceColor(movingPiece)));
			}
		}
	}

	generateAllMoves(color: Color, legal: boolean): Move[] {
		const allMoves: Move[] = [];
		// Iterate only over squares occupied by this color
		let occ = colorOccupancy(this.board, color);

		while (occ > 0n) {
			const sq = lsb(occ);
			occ &= occ - 1n; // clear LSB
			const row = Number(sq) >> 3;
			const col = Number(sq) & 7;
			// console.log("Generating all moves; now @ square:", Number(sq));

			allMoves.push(...this.generateMoves(row, col, legal));
		}
		return allMoves;
	}

	generateMoves(fromRow: number, fromCol: number, legal: boolean): Move[] {
		const fromSq = squareIndex(fromRow, fromCol);
		// console.log("Generating moves for square:", fromSq)

		const movingPiece = this.getSquare(fromRow, fromCol);
		if (movingPiece === null) return [];

		const generatorCtx: GeneratorContext = {
			board: this.board,
			moveHistory: this.moveHistory,
			castlingRights: {
				kingSide:  this.kingSideCastleRights[pieceColor(movingPiece)],
				queenSide: this.queenSideCastleRights[pieceColor(movingPiece)],
			},
		};

		const color = pieceColor(movingPiece);
		let pseudoLegalMoves: Move[] = [];

		switch (pieceName(movingPiece)) {
			case PieceName.Pawn:
				pseudoLegalMoves = generatePseudoPawnMoves(fromSq, color, generatorCtx);
				break;
			case PieceName.Rook:
				pseudoLegalMoves = generatePseudoRookMoves(fromSq, color, generatorCtx);
				break;
			case PieceName.Bishop:
				pseudoLegalMoves = generatePseudoBishopMoves(fromSq, color, generatorCtx);
				break;
			case PieceName.Knight:
				pseudoLegalMoves = generatePseudoKnightMoves(fromSq, color, generatorCtx);
				break;
			case PieceName.King:
				pseudoLegalMoves = generatePseudoKingMoves(fromSq, color, generatorCtx);
				break;
			case PieceName.Queen:
				pseudoLegalMoves = [
					...generatePseudoRookMoves(fromSq, color, generatorCtx),
					...generatePseudoBishopMoves(fromSq, color, generatorCtx),
				];
				break;
		}

		if (!legal) return pseudoLegalMoves;

		return pseudoLegalMoves.filter(m => {
			const sim = this.copy();
			sim.makeMove(m);
			return !sim.isInCheck(color);
		});
	}

	validateMove(move: Move, legal: boolean): { valid: true; enrichedMove: Move } | { valid: false } {
		const { fromRow, fromCol, toRow, toCol } = disectMove(move);
		const movingPiece = this.getSquare(fromRow, fromCol);
		if (movingPiece === null) return { valid: false };

		const dest = this.getSquare(toRow, toCol);
		if (dest !== null && pieceColor(dest) === pieceColor(movingPiece)) return { valid: false };

		const possibleMoves = this.generateMoves(fromRow, fromCol, legal);
		const matched = possibleMoves.filter(m => moveToRow(m) === toRow && moveToCol(m) === toCol);

		if (matched.length === 0) return { valid: false };
		if (matched.length === 1) return { valid: true, enrichedMove: matched[0] };

		// more than one move found; must be promotion ambiguity
		const promotionMove = matched.find(
			m => movePromotion(move) === movePromotion(m)
		);
		if (!promotionMove) throw new Error("Multiple moves found but none match the promotion piece.");
		return { valid: true, enrichedMove: promotionMove };
	}

	isInCheck(color: Color): boolean {
		const kingPos = this.findKing(color);
		if (!kingPos) return true;

		const opponentColor: Color = color === Color.White ? Color.Black : Color.White;
		return this.generateAllMoves(opponentColor, false)
			.some(m => moveToRow(m) === kingPos.row && moveToCol(m) === kingPos.col);
	}

	// FIXME: USE ENUMS
	isMate(color: Color): Exclude<GameState, GameState.Draw> {
		if (!this.hasPiece(makePiece(PieceName.King, color))) return GameState.Checkmate;

		// console.log("Checking for mate by generating all possible moves for color", color);
		const allMoves = this.generateAllMoves(color, true);
		// console.log(allMoves)
		if (allMoves.length === 0) {
			return this.isInCheck(color) ? GameState.Checkmate : GameState.Stalemate;
		}
		return GameState.Running;
	}

	checkInsufficientMaterial(): boolean {
		let totalPieces = 0;
		const minorPieces: Piece[] = [];

		for (let p = 0; p < 12; p++) {
			const count = popcount(this.board[p]);
			totalPieces += count;
			const name = pieceName(p as Piece);
			if (name === PieceName.Bishop || name === PieceName.Knight) {
				for (let i = 0; i < count; i++) minorPieces.push(p as Piece);
			}
			// If there are any pawns, rooks, or queens, material is sufficient
			if ((name === PieceName.Pawn || name === PieceName.Rook || name === PieceName.Queen) && count > 0) {
				return false;
			}
		}

		if (totalPieces === 2) return true; // K vs K
		if (totalPieces === 3 && minorPieces.length === 1) return true; // K+minor vs K
		return false;
	}

	// UTILS ###########################################################################################################

	hasPiece(piece: Piece): boolean {
		return this.board[piece] !== 0n;
	}

	findKing(color: Color): { row: number; col: number } | null {
		const kingPiece = makePiece(PieceName.King, color);
		const bb = this.board[kingPiece];
		if (!bb) return null;
		const sq = Number(lsb(bb));
		return { row: sq >> 3, col: sq & 7 };
	}

	copy(): Chess {
		const c = new Chess(this.numRanks, this.numFiles, this.getBoard());
		c.currentTurn         = this.currentTurn;
		c.moveHistory         = this.getHistory();
		c.kingSideCastleRights  = { ...this.kingSideCastleRights };
		c.queenSideCastleRights = { ...this.queenSideCastleRights };
		c.gameDetails         = { ...this.gameDetails };
		c.materialScore       = this.materialScore;
		return c;
	}

	generateBoard(
		ranks: number,
		files: number
	): Board {
		const newBoard = makeEmptyBoard();
		for (let r = 0; r < ranks; r++) {
			for (let f = 0; f < files; f++) {
				const piece = standardChessSetup(r, f);
				if (piece !== null) {
					const sq = squareIndex(r, f);
					newBoard[piece] |= squareMask(sq);
				}
			}
		}

		return newBoard;
	}
}
