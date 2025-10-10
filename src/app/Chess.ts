import {Board, Move, MoveHistoryEntry, Piece} from "@/app/utils";
import {Color} from "./utils";

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
	getMoveHistory() {
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
		const { fromRow, fromCol, toRow, toCol } = move;

		if (
			fromRow == toRow && fromCol == toCol ||
			fromRow < 0 || fromRow >= this.numRanks ||
			fromCol < 0 || fromCol >= this.numFiles ||
			this.getSquare(fromRow, fromCol) === null
		) return false;

		const piece = this.getSquare(fromRow, fromCol)!;
		if (piece.color !== this.currentTurn) return false;

		if (this.getSquare(toRow, toCol)?.color === this.currentTurn) return false; // Can't capture own piece

		this.setSquare(toRow, toCol, piece);
		this.setSquare(fromRow, fromCol, null);

		this.moveHistory.push({ move: move, piece });

		return true;
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