import {Board, Move, MoveHistoryEntry, Piece} from "@/app/utils";
import {Color} from "./utils";
import {
	validateBishopMove,
	validateKingMove,
	validateKnightMove,
	validatePawnMove,
	validateRookMove
} from "@/app/validators";

export class Chess {
	private board: Board;
	private numRanks: number;
	private numFiles: number;
	private moveHistory: MoveHistoryEntry[];

	private currentTurn: Color = "W";

	constructor(
		ranks: number,
		files: number,
		board?: Board,
		moveHistory?: MoveHistoryEntry[],
		currentTurn?: Color
	) {
		this.numRanks = ranks;
		this.numFiles = files;
		this.board = board ?
			board.map(row => row.slice()) :
			Array.from({length: ranks}, () => Array(files).fill(null));

		this.moveHistory = moveHistory ? [...moveHistory] : [];
		this.currentTurn = currentTurn ? currentTurn : "W";
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

	// SETTERS #########################################################################################################
	nextTurn(): Chess {
		this.currentTurn = this.currentTurn === "W" ? "B" : "W";

		return this;
	}

	setSquare(row: number, col: number, piece: Piece | null): Chess {
		if (row < 0 || row >= this.numRanks || col < 0 || col >= this.numFiles) return this;

		this.board[row][col] = piece;

		return this;
	}

	// CHESS FUNCTIONS #################################################################################################
	/**
	 * Moves a piece from one square to another.
	 * @param move
	 * @returns A boolean indicating whether the move was successful.
	 */
	move(move: Move): boolean {
		const {fromRow, fromCol, toRow, toCol} = move;

		if (
			fromRow == toRow && fromCol == toCol ||
			fromRow < 0 || fromRow >= this.numRanks ||
			fromCol < 0 || fromCol >= this.numFiles ||
			this.getSquare(fromRow, fromCol) === null
		) return false;

		const movingPiece = this.getSquare(fromRow, fromCol)!;
		if (movingPiece.color !== this.currentTurn) return false; // Incorrect turn

		const moveValidation = this.validateMove(move);
		if (!moveValidation.valid) return false; // Invalid move for piece

		// Make the move
		if (moveValidation.isEnPassant) {
			const epRow = movingPiece.color === "W" ? toRow + 1 : toRow - 1;
			this.setSquare(epRow, toCol, null); // Remove the captured pawn
		}
		this.setSquare(toRow, toCol, movingPiece);
		this.setSquare(fromRow, fromCol, null);

		this.moveHistory.push({move: move, piece: movingPiece});


		return true;
	}

	getAllValidMoves(color: Color): Move[] {
		const allMoves: Move[] = [];
		for (let r = 0; r < this.numRanks; r++) {
			for (let c = 0; c < this.numFiles; c++) {
				const piece = this.getSquare(r, c);
				if (piece && piece.color === color) {
					const pieceMoves = this.getValidMoves(r, c);
					allMoves.push(...pieceMoves);
				}
			}
		}
		return allMoves;
	}

	getValidMoves(row: number, col: number): Move[] {
		const piece = this.getSquare(row, col);
		if (!piece) return [];

		const possibleMoves: Move[] = [];
		for (let r = 0; r < this.numRanks; r++) {
			for (let c = 0; c < this.numFiles; c++) {
				if (r === row && c === col) continue; // Skip the square the piece is on

				const move: Move = { fromRow: row, fromCol: col, toRow: r, toCol: c };
				const validation = this.validateMove(move);
				if (validation.valid) {
					possibleMoves.push(move);
				}
			}
		}

		return possibleMoves;
	}

	validateMove(move: Move): {
		valid: boolean;
		isEnPassant?: boolean;
	} {
		const {fromRow, fromCol, toRow, toCol} = move;
		const movingPiece = this.getSquare(fromRow, fromCol);
		if (!movingPiece) return { valid: false }; // No piece to move

		if (this.getSquare(toRow, toCol)?.color === this.getTurn()) return { valid: false }; // No cannibalism...
		// I'm pretty sure ^^ is already checked in the individual piece validators but whatever

		const validatorCtx = {
			board: this.board,
			moveHistory: this.moveHistory,
			numRanks: this.numRanks
		}

		switch (movingPiece.name) {
			case "Pawn":
				return validatePawnMove(move, movingPiece.color, validatorCtx);
			case "Rook":
				return validateRookMove(move, movingPiece.color, validatorCtx);
			case "Bishop":
				return validateBishopMove(move, movingPiece.color, validatorCtx);
			case "Knight":
				return validateKnightMove(move, movingPiece.color, validatorCtx);
			case "King":
				return validateKingMove(move, movingPiece.color, validatorCtx);
			case "Queen":
				return (validateRookMove(move, movingPiece.color, validatorCtx).valid || validateBishopMove(move, movingPiece.color, validatorCtx).valid) ? { valid: true } : { valid: false };
			default:
				return { valid: true };
		}
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

	// UTILITIES #######################################################################################################
	copy(): Chess {
		return new Chess(this.numRanks, this.numFiles, this.board, this.moveHistory, this.currentTurn);
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

		this.board = newBoard;
		this.numRanks = ranks;
		this.numFiles = files;

		return this;
	}
}