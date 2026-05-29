// A unified base interface for your raw underlying logic
import {GeneratorContext} from "@/app/Generator";
import {Color, MoveFlag} from "@/app/utils/types";

export interface GeometryResult {
	attackMask: bigint;
	flag: MoveFlag;
}

export interface MoveGeometry {
	getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult;
}
