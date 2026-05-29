import {Color} from "@/app/utils/types";
import {
	ANTI_DIAG,
	DIAG,
	FILE,
	NOT_A_FILE,
	NOT_AB_FILE, NOT_GH_FILE,
	NOT_H_FILE,
	RANK,
	squareMask
} from "@/app/utils/bitboardHelpers";
import {not64, reverseBits, u64} from "@/app/utils/bitUtils";

export function getPawnAttacks(sq: number, color: Color): bigint {
	const pawn = squareMask(sq);

	if (color === Color.White) {
		return u64(pawn << 7n) & NOT_H_FILE | u64(pawn << 9n) & NOT_A_FILE;
	} else {
		return u64(pawn >> 9n) & NOT_H_FILE | u64(pawn >> 7n) & NOT_A_FILE;
	}
}
export function getRookAttacks(sq: number, occupied: bigint): bigint {
	const sqMask = squareMask(sq);

	const fileMask = FILE[sq & 7];
	const rankMask = RANK[sq >> 3];

	// --- 1. VERTICAL MOVES ---
	// CRITICAL: Strip the rook out of the occupancy line BEFORE subtracting
	const oFile = (occupied & fileMask) ^ sqMask;

	const fwdFile = u64(oFile - u64(2n * sqMask)) ^ oFile;

	const revOFile = reverseBits(oFile);
	const revSqFile = reverseBits(sqMask);
	const bwdFile = reverseBits(u64(revOFile - u64(2n * revSqFile)) ^ revOFile);

	const verticalMoves = u64(fwdFile | bwdFile) & fileMask;

	// --- 2. HORIZONTAL MOVES ---
	// CRITICAL: Strip the rook out of the occupancy line BEFORE subtracting
	const oRank = (occupied & rankMask) ^ sqMask;

	const fwdRank = u64(oRank - u64(2n * sqMask)) ^ oRank;

	const revORank = reverseBits(oRank);
	const revSqRank = reverseBits(sqMask);
	const bwdRank = reverseBits(u64(revORank - u64(2n * revSqRank)) ^ revORank);

	const horizontalMoves = u64(fwdRank | bwdRank) & rankMask;

	// --- 3. COMBINE ---
	// Mask out the rook's standing square from the total attack set
	return u64(verticalMoves | horizontalMoves) & not64(sqMask);
}
export function getBishopAttacks(sq: number, occupied: bigint): bigint {
	const sqMask = squareMask(sq);
	// Diagonal moves
	const diagonal = DIAG[sq];
	const antiDiagonal = ANTI_DIAG[sq];

	const diagOccupancy = occupied & diagonal;
	const antiDiagOccupancy = occupied & antiDiagonal;

	const diagMoves = (u64(diagOccupancy - 2n * sqMask) ^ reverseBits(reverseBits(u64(diagOccupancy)) - 2n * reverseBits(sqMask))) & diagonal;
	const antiDiagMoves = (u64(antiDiagOccupancy - 2n * sqMask) ^ reverseBits(reverseBits(antiDiagOccupancy) - 2n * reverseBits(sqMask))) & antiDiagonal;
	return u64(diagMoves | antiDiagMoves) & not64(sqMask);
}
export function getKnightAttacks(sq: number): bigint {
	const sqMask = squareMask(sq);

	return u64(sqMask << 17n) & NOT_A_FILE
		| u64(sqMask << 15n) & NOT_H_FILE
		| u64(sqMask << 10n) & NOT_AB_FILE
		| u64(sqMask << 6n ) & NOT_GH_FILE
		| sqMask >> 17n      & NOT_H_FILE
		| sqMask >> 15n      & NOT_A_FILE
		| sqMask >> 10n      & NOT_GH_FILE
		| sqMask >> 6n       & NOT_AB_FILE;
}
