import {Color, Piece} from "@/app/utils";

export class Move {
	readonly fromRow: number;
	readonly fromCol: number;
	readonly toRow: number;
	readonly toCol: number;

	private isEnPassant: boolean = false;

	private isPromotion: boolean = false;
	private promoteTo?: Piece;

	private isCastle: boolean = false;

	private isCapture: boolean = false;
	private capturedPiece?: Piece;

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
	getPromotionPiece() {
		return this.promoteTo ?? null;
	}
	isCaptureMove() {
		return this.isCapture;
	}
	getCapturedPiece() {
		return this.capturedPiece ?? null;
	}
	isCastleMove() {
		return this.isCastle;
	}

	markAsEnPassant(capturedColor: Color): Move {
		this.isEnPassant = true;
		this.capturedPiece = {
			name: "Pawn",
			color: capturedColor
		}
		return this;
	}
	markAsPromotion(promoteTo: Piece): Move {
		this.isPromotion = true;
		this.promoteTo = promoteTo;
		return this;
	}
	markAsCastle(): Move {
		this.isCastle = true;
		return this;
	}
	markAsCapture(capturedPiece: Piece): Move {
		this.isCapture = true;
		this.capturedPiece = capturedPiece;
		return this;
	}

	copy(): Move {
		const newMove = new Move(this.fromRow, this.fromCol, this.toRow, this.toCol);
		newMove.isEnPassant = this.isEnPassant;
		newMove.isPromotion = this.isPromotion;
		newMove.promoteTo = this.promoteTo;
		newMove.isCastle = this.isCastle;
		newMove.isCapture = this.isCapture;

		return newMove;
	}
}