// A unified base interface for your raw underlying logic
import {GeneratorContext} from "@/app/generator/Generator";
import {Color, MoveFlag} from "@/app/utils/types";

export interface GeometryResult {
	attackMask: bigint;
	flag: MoveFlag;
}

export interface GeometryDetails {
	name: string;
	moveDesc: string;
	captureDesc: string;
}

export interface MoveGeometry {
	getDetails(): GeometryDetails;
	getAttackMask(fromSq: number, color: Color, ctx: GeneratorContext): GeometryResult;
}
