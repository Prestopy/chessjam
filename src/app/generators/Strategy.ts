import {GeneratorContext} from "@/app/generators/generators";
import {Color, Move} from "@/app/utils/types";

export interface PieceStrategy {
	generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[];
}
