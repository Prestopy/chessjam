import {Color, Move} from "@/app/utils/types";

export interface StrategyModifier {
	apply(moves: Move[], color: Color): Move[]
}
