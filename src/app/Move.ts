import {Color} from "sharp";
import {Board, MoveHistoryEntry} from "@/app/utils";

export class Move {
	readonly fromRow: number;
	readonly fromCol: number;
	readonly toRow: number;
	readonly toCol: number;

	private isEnPassant: boolean = false;
	private isPromotion: boolean = false;
	private isCastle: boolean = false;
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
	isCastleMove() {
		return this.isCastle;
	}

	markAsEnPassant(): Move {
		this.isEnPassant = true;
		return this;
	}
	markAsPromotion(): Move {
		this.isPromotion = true;
		return this;
	}
	markAsCastle(): Move {
		this.isCastle = true;
		return this;
	}
	markAsCapture(): Move {
		this.isCapture = true;
		return this;
	}
}