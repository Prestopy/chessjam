// ##### Pieces #####
export const enum Color {
	White = 0,
	Black = 1,
}

export const enum PieceName {
	Pawn = 0,
	Knight = 1,
	Bishop = 2,
	Rook = 3,
	Queen = 4,
	King = 5,
}

export const STRING_PIECE_NAMES: Record<PieceName, string> = {
	[PieceName.Pawn]: "Pawn",
	[PieceName.Knight]: "Knight",
	[PieceName.Bishop]: "Bishop",
	[PieceName.Rook]: "Rook",
	[PieceName.Queen]: "Queen",
	[PieceName.King]: "King",
}

export const enum Piece {
	WhitePawn = 0,
	WhiteKnight = 1,
	WhiteBishop = 2,
	WhiteRook = 3,
	WhiteQueen = 4,
	WhiteKing = 5,
	BlackPawn = 6,
	BlackKnight = 7,
	BlackBishop = 8,
	BlackRook = 9,
	BlackQueen = 10,
	BlackKing = 11,
}


// ##### Game #####
export type Board = BigInt64Array & { length: 12 };

export enum GameState {
	Running,
	Checkmate,
	Stalemate,
	Draw,
}

export interface GameDetails {
	state: GameState;
	winner: Color | null;
}

export enum GameStage {
	Opening,
	Midgame,
	Endgame
}


// ##### Visuals #####
export interface SquareHighlight {
	row: number;
	col: number;
	color: string;
	type: "highlight" | "dot";
}


// ##### Move types #####
export type Move = number;

export const enum MoveFlag {
	None = 0,
	Capture = 1 << 0,
	Promotion = 1 << 1,
	EnPassant = 1 << 2,  // implies Capture
	Castle = 1 << 3,
	DoublePush = 1 << 4,  // needed for en passant detection on next move
}

export interface MoveHistoryEntry {
	move: Move;
	piece: Piece
}

// ##### Engine #####
export interface EngineDiagnostics {
	nodesVisited: number;
	depthReached: number;
	currentEval: number;
	timeElapsedMs: number;
	bestMove?: string;
}
