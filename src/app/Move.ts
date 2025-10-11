import {Color} from "sharp";
import {Board, MoveHistoryEntry} from "@/app/utils";

export class Move {
	readonly fromRow: number;
	readonly fromCol: number;
	readonly toRow: number;
	readonly toCol: number;

	private isEnPassant: boolean = false;
	private isPromotion: boolean = false;
	private isCapture: boolean = false;

	constructor(fromRow: number, fromCol: number, toRow: number, toCol: number) {
		this.fromRow = fromRow;
		this.fromCol = fromCol;
		this.toRow = toRow;
		this.toCol = toCol;
	}

	isEnPassantMove() {
		return this.isEnPassant;
	}
	isPromotionMove() {
		return this.isPromotion;
	}
	isCaptureMove() {
		return this.isCapture;
	}
	markAsEnPassant() {
		this.isEnPassant = true;
	}
	markAsPromotion() {
		this.isPromotion = true;
	}
	markAsCapture() {
		this.isCapture = true;
	}

	enrichMove(board: Board, moveHistory: MoveHistoryEntry[]): Move {
		const piece = board[this.fromRow][this.fromCol];
		if (!piece) return this;

		if (piece.name === "Pawn") {
			const lastMove = moveHistory[moveHistory.length - 1];
			if (lastMove) {
				const lastMovedPiece = board[lastMove.move.toRow][lastMove.move.toCol];
				if (
					lastMovedPiece &&
					lastMovedPiece.name === "Pawn" &&
					Math.abs(lastMove.move.toRow - lastMove.move.fromRow) === 2 && // Last move was a 2-square pawn advance
					lastMove.move.toRow === this.fromRow && // Last moved pawn is now next to the moving pawn
					Math.abs(lastMove.move.toCol - this.fromCol) === 1 && // Last moved pawn is adjacent in column
					this.toRow === (piece.color === "W" ? this.fromRow - 1 : this.fromRow + 1) && // Moving diagonally forward
					this.toCol === lastMove.move.toCol // Moving to the column of the last moved pawn
				) {
					this.markAsEnPassant();
				}
			}
		}

		// Can handle castling, promotion, etc. here too
		return this;
	}
}