import {PieceName} from "@/app/utils/types";

export const PHASE_WEIGHTS = {
	[PieceName.Bishop]: 1,
	[PieceName.Knight]: 1,
	[PieceName.Rook]: 2,
	[PieceName.Queen]: 4,
}


// ##### Misc #####
export const pieceSymbols: { [key in PieceName]: { 0: string; 1: string } } = {
	5: {0: "/pieces/wk.svg", 1: "/pieces/bk.svg"},
	4: {0: "/pieces/wq.svg", 1: "/pieces/bq.svg"},
	3: {0: "/pieces/wr.svg", 1: "/pieces/br.svg"},
	2: {0: "/pieces/wb.svg", 1: "/pieces/bb.svg"},
	1: {0: "/pieces/wn.svg", 1: "/pieces/bn.svg"},
	0: {0: "/pieces/wp.svg", 1: "/pieces/bp.svg"}
}
