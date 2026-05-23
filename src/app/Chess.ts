import {Board, GameDetails, GameState, MoveHistoryEntry, Piece, swapColor} from "@/app/utils";
import {Color} from "./utils";
import {
	generatePseudoBishopMoves, generatePseudoKingMoves, generatePseudoKnightMoves,
	generatePseudoPawnMoves, generatePseudoRookMoves,
} from "@/app/validators";
import {Move} from "@/app/Move";

export class Chess {
	private board: Board;
	private numRanks: number;
	private numFiles: number;
	private moveHistory: MoveHistoryEntry[];
	private gameDetails: GameDetails;


	private kingSideCastleRights: {
		[key in Color]: boolean
	} = { W: true, B: true };
	private queenSideCastleRights: {
		[key in Color]: boolean
	} = { W: true, B: true };

	private currentTurn: Color = "W";

	constructor(
		ranks: number,
		files: number,
		board?: Board,
	) {
		this.numRanks = ranks;
		this.numFiles = files;
		this.board = board ?
			board.map(row => row.slice()) :
			Array.from({length: ranks}, () => Array(files).fill(null));

		this.moveHistory = [];
		this.currentTurn = "W";
		this.gameDetails = {
			state: "running",
			winner: null
		};
	}

	// GETTERS #########################################################################################################
	getBoard() {
		return this.board.map(row => row.slice());
	}

	getSquare(row: number, col: number): Piece | null {
		if (row < 0 || row >= this.numRanks || col < 0 || col >= this.numFiles) return null;

		return this.board[row][col];
	}

	getRanks(): number {
		return this.numRanks;
	}

	getFiles(): number {
		return this.numFiles;
	}

	getHistory() {
		return [...this.moveHistory];
	}

	getTurn(): Color {
		return this.currentTurn;
	}

	getGameDetails(): GameDetails {
		return this.gameDetails;
	}

	// SETTERS #########################################################################################################
	nextTurn(): Chess {
		this.currentTurn = this.currentTurn === "W" ? "B" : "W";

		return this;
	}

	setBoard(b: Board) {
		this.board = b;
	}

	setSquare(row: number, col: number, piece: Piece | null) {
		if (row < 0 || row >= this.numRanks || col < 0 || col >= this.numFiles) return this;

		this.board[row][col] = piece;
	}

	addHistoryEntry(entry: MoveHistoryEntry) {
		this.moveHistory.push(entry);
	}

	// CHESS FUNCTIONS #################################################################################################
	/**
	 * Validate a move, then apply it to the board if valid.
	 * @param move
	 * @returns A boolean indicating whether the move was successful.
	 */
	move(move: Move): { ok: true, enrichedMove: Move } | { ok: false } {
		const {fromRow, fromCol, toRow, toCol} = move;

		if (
			fromRow == toRow && fromCol == toCol ||
			fromRow < 0 || fromRow >= this.numRanks ||
			fromCol < 0 || fromCol >= this.numFiles ||
			this.getSquare(fromRow, fromCol) === null
		) return { ok: false };

		const movingPiece = this.getSquare(fromRow, fromCol)!;
		if (movingPiece.color !== this.currentTurn) return { ok: false }; // Incorrect turn

		// Check for move validity
		const moveValidation = this.validateMove(move, true);
		if (!moveValidation.valid) return { ok: false };

		// capture the piece at destination BEFORE applying the move so we can
		// correctly update castling rights if a rook was captured
		const capturedPieceBefore = this.getSquare(toRow, toCol);

		// Make the move
		const enrichedMove = moveValidation.enrichedMove;
		this.makeMove(enrichedMove);
		this.addHistoryEntry({ move: enrichedMove, piece: movingPiece });

		// Update castling rights
		if (movingPiece.name === "King") { // If king moves, lose both castling rights
			this.kingSideCastleRights[movingPiece.color] = false;
			this.queenSideCastleRights[movingPiece.color] = false;
		} else if (movingPiece.name === "Rook") { // If a rook moves, lose that side's castling right
			if (fromCol === 0) this.queenSideCastleRights[movingPiece.color] = false;
			else if (fromCol === this.numFiles - 1) this.kingSideCastleRights[movingPiece.color] = false;
		} else if (enrichedMove.isCaptureMove()) { // If a rook is captured, lose that side's castling right
			const capturedPiece = capturedPieceBefore;
			if (capturedPiece && capturedPiece.name === "Rook") {
				if (toCol === 0) this.queenSideCastleRights[capturedPiece.color] = false;
				else if (toCol === this.numFiles - 1) this.kingSideCastleRights[capturedPiece.color] = false;
			}
		}

		if (this.isMate(swapColor(movingPiece.color)) !== "running") {
			this.gameDetails.state = this.isMate(swapColor(movingPiece.color));
			this.gameDetails.winner = this.gameDetails.state === "checkmate" ? movingPiece.color : null;
		} else if (this.checkInsufficientMaterial()) {
			this.gameDetails.state = "draw";
			this.gameDetails.winner = null;
		}

		return { ok: true, enrichedMove };
	}

	/**
	 * Executes the move on the board without any validation.
	 * @param move
	 */
	makeMove(move: Move): { ok: boolean } {
		const {fromRow, fromCol, toRow, toCol} = move;
		const movingPiece = this.getSquare(move.fromRow, move.fromCol);
		if (!movingPiece) return { ok: false };

		if (move.isPromotionMove()) {
			this.setSquare(toRow, toCol, move.getPromotionPiece());
			this.setSquare(fromRow, fromCol, null);
			return { ok: true };
		}

		if (move.isEnPassantMove()) {
			const epRow = movingPiece?.color === "W" ? toRow + 1 : toRow - 1;
			this.setSquare(epRow, toCol, null); // Remove the captured pawn
		}

		if (move.isCastleMove()) {
			if (toCol === fromCol + 2) {
				// King-side castle
				const rook = this.getSquare(fromRow, this.numFiles - 1);
				if (rook && rook.name === "Rook" && rook.color === movingPiece.color) {
					this.setSquare(fromRow, fromCol + 1, rook);
					this.setSquare(fromRow, this.numFiles - 1, null);
				}
			} else if (toCol === fromCol - 2) {
				// Queen-side castle
				const rook = this.getSquare(fromRow, 0);
				if (rook && rook.name === "Rook" && rook.color === movingPiece.color) {
					this.setSquare(fromRow, fromCol - 1, rook);
					this.setSquare(fromRow, 0, null);
				}
			}
		}

		this.setSquare(toRow, toCol, movingPiece);
		this.setSquare(fromRow, fromCol, null);

		return { ok: true };
	}

	/**
	 * Generates all moves for a given color. The moves returned have flags attached.
	 * @param color
	 * @param legal - If true, only returns legal moves; if false, returns pseudo-legal moves.
	 */
	generateAllMoves(color: Color, legal: boolean): Move[] {
		const allMoves: Move[] = [];
		for (let r = 0; r < this.numRanks; r++) {
			for (let c = 0; c < this.numFiles; c++) {
				const piece = this.getSquare(r, c);
				if (piece && piece.color === color) {
					const pieceMoves = this.generateMoves(r, c, legal);
					allMoves.push(...pieceMoves);
				}
			}
		}

		return allMoves;
	}

	/**
	 * Generates all moves for a piece at a given position. The moves returned have flags attached.
	 * @param fromRow
	 * @param fromCol
	 * @param legal - If true, only returns legal moves; if false, returns pseudo-legal moves.
	 */
	generateMoves(fromRow: number, fromCol: number, legal: boolean): Move[] {
		const movingPiece = this.getSquare(fromRow, fromCol);
		if (!movingPiece) return [];

		const generatorCtx = {
			board: this.board,
			moveHistory: this.moveHistory,
			numRanks: this.numRanks,
			castlingRights: {
				kingSide: this.kingSideCastleRights[movingPiece.color],
				queenSide: this.queenSideCastleRights[movingPiece.color]
			}
		}

		let pseudoLegalMoves: Move[] = [];
		switch (movingPiece.name) {
			case "Pawn":
				pseudoLegalMoves = generatePseudoPawnMoves(fromRow, fromCol, movingPiece.color, generatorCtx);
				break;
			case "Rook":
				pseudoLegalMoves = generatePseudoRookMoves(fromRow, fromCol, movingPiece.color, generatorCtx);
				break;
			case "Bishop":
				pseudoLegalMoves = generatePseudoBishopMoves(fromRow, fromCol, movingPiece.color, generatorCtx);
				break;
			case "Knight":
				pseudoLegalMoves = generatePseudoKnightMoves(fromRow, fromCol, movingPiece.color, generatorCtx);
				break;
			case "King":
				pseudoLegalMoves = generatePseudoKingMoves(fromRow, fromCol, movingPiece.color, generatorCtx);
				break;
			case "Queen":
				pseudoLegalMoves = generatePseudoRookMoves(fromRow, fromCol, movingPiece.color, generatorCtx)
					.concat(generatePseudoBishopMoves(fromRow, fromCol, movingPiece.color, generatorCtx));
				break;
			default:
		}

		// Only check for pseudo-legality
		if (!legal) return pseudoLegalMoves;

		const legalMoves: Move[] = [];
		// Ensure this move doesn't put own king in check
		for (const moveToVerify of pseudoLegalMoves)
		{
			const simulatedGame = this.copy();
			simulatedGame.makeMove(moveToVerify);
			if (!simulatedGame.isInCheck(movingPiece.color)) legalMoves.push(moveToVerify);
		}

		return legalMoves;
	}

	/**
	 * Validate the given move
	 * @param move
	 * @param legal - If true, checks for legality (including check); if false, only checks for pseudo-legality.
	 */
	validateMove(move: Move, legal: boolean): { valid: true, enrichedMove: Move } | { valid: false } {
		const {fromRow, fromCol, toRow, toCol} = move;
		const movingPiece = this.getSquare(fromRow, fromCol);
		if (!movingPiece) return { valid: false }; // No piece to move

		if (this.getSquare(toRow, toCol)?.color === movingPiece.color) return { valid: false,  }; // No cannibalism...
		// I'm pretty sure ^^ is already checked in the individual piece validators but whatever

		const possibleMoves = this.generateMoves(fromRow, fromCol, legal);
		const moveMade = possibleMoves.filter(m => m.toRow === toRow && m.toCol === toCol);

		if (moveMade.length === 0) return { valid: false };
		if (moveMade.length === 1) return { valid: true, enrichedMove: moveMade[0] };

		// Multiple moves found (e.g., promotions)
		const promotionMove = moveMade.find(m => m.getPromotionPiece()?.name === move.getPromotionPiece()?.name);
		if (!promotionMove) {
			throw new Error("Multiple moves found but none match the promotion piece.");
			// return { valid: false };
		}
		return { valid: true, enrichedMove: promotionMove };
	}

	isInCheck(color: Color): boolean {
		const kingPosition = this.findKing(color);
		if (!kingPosition) return true;

		const opponentColor: Color = color === "W" ? "B" : "W";
		const opponentMoves = this.generateAllMoves(opponentColor, false);

		return opponentMoves.some(move => move.toRow === kingPosition!.row && move.toCol === kingPosition!.col);
	}

	isMate(color: Color): Exclude<GameState, "draw"> {
		const hasKing = this.hasPiece({name: "King", color: color});
		if (!hasKing) return "checkmate";

		const allMoves = this.generateAllMoves(color, true);
		if (allMoves.length === 0) {
			return this.isInCheck(color) ? "checkmate" : "stalemate";
		}

		return "running";
	}

	checkInsufficientMaterial(): boolean { // FIXME: Not complete
		const pieces = this.board.flat().filter(p => p !== null) as Piece[];
		if (pieces.length === 2) {
			// Only kings left
			return pieces.every(p => p.name === "King");
		} else if (pieces.length === 3) {
			// King and minor piece vs King
			const minorPieces = pieces.filter(p => p.name !== "King");
			return minorPieces.length === 1 && (minorPieces[0].name === "Bishop" || minorPieces[0].name === "Knight");
		}

		// there are other conditions, but FOR SIMPLICITY (im lazy)

		return false;
	}


	// UTILS ###########################################################################################################

	hasPiece(piece: Piece) {
		return this.board.flat().some(p => p?.name === piece.name && p?.color === piece.color);
	}

	findKing(color: Color): { row: number; col: number } | null {
		for (let r = 0; r < this.numRanks; r++) {
			for (let c = 0; c < this.numFiles; c++) {
				const piece = this.getSquare(r, c);
				if (piece && piece.name === "King" && piece.color === color) {
					return { row: r, col: c };
				}
			}
		}
		return null;
	}

	countPoints(color: string): number {
		const pieceValues: { [key: string]: number } = {
			"Pawn": 1,
			"Knight": 3,
			"Bishop": 3,
			"Rook": 5,
			"Queen": 9,
			"King": 0
		};

		let totalPoints = 0;
		for (const rank of this.board) {
			for (const piece of rank) {
				if (piece && piece.color === color) {
					totalPoints += pieceValues[piece.name] || 0;
				}
			}
		}
		return totalPoints;
	}

	// OTHER ###########################################################################################################
	copy(): Chess {
		const c = new Chess(this.numRanks, this.numFiles, this.getBoard());
		c.currentTurn = this.currentTurn;
		c.moveHistory = this.getHistory();

		c.kingSideCastleRights = { ...this.kingSideCastleRights };
		c.queenSideCastleRights = { ...this.queenSideCastleRights };
		c.gameDetails = { ...this.gameDetails };

		return c;
	}

	generateBoard(
		ranksOrGenerator: number | ((rank: number, file: number) => Piece | null),
		files?: number,
		generator?: (rank: number, file: number) => Piece | null
	): Chess {
		let ranks: number;
		if (typeof ranksOrGenerator === "function") {
			generator = ranksOrGenerator;
			ranks = this.numRanks;
			files = this.numFiles;
		} else {
			ranks = ranksOrGenerator;
			files = files!;
		}

		const newBoard: Board = [];
		for (let i = 0; i < ranks; i++) {
			const row: (Piece | null)[] = [];
			for (let j = 0; j < files; j++) {
				row.push(generator ? generator(i, j) : null);
			}
			newBoard.push(row);
		}

		this.setBoard(newBoard);
		this.numRanks = ranks;
		this.numFiles = files;

		return this;
	}
}
