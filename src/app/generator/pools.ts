// Pool 1: Geometries that make sense for standard movement or captures
import {MoveGeometry} from "@/app/generator/geometries/MoveGeometry";
import {SliderGeometry} from "@/app/generator/geometries/SliderGeometry";
import {getBishopAttacks, getKnightAttacks, getRookAttacks} from "@/app/generator/strategies/attacks";
import {LeaperGeometry} from "@/app/generator/geometries/LeaperGeometry";
import {AroundGeometry} from "@/app/generator/geometries/AroundGeometry";
import {SinglePushGeometry} from "@/app/generator/geometries/SinglePushGeometry";
import {DiagonalGeometry} from "@/app/generator/geometries/DiagonalGeometry";
import {DoublePushGeometry} from "@/app/generator/geometries/DoublePushGeometry";
import {EnPassantGeometry} from "@/app/generator/geometries/EnPassantGeometry";
import {CastleGeometry} from "@/app/generator/geometries/CastleGeometry";
import {StrategyModifier} from "@/app/generator/modifiers/StrategyModifier";
import {PromotionModifier} from "@/app/generator/modifiers/PromotionModifier";
import {CannotCapture} from "@/app/generator/geometries/CannotCapture";
import {CanOnlyCapture} from "@/app/generator/geometries/CanOnlyCapture";

export const GEOMETRY_POOL: (() => MoveGeometry)[] = [
	() => new SliderGeometry(getRookAttacks, {
		name: "Rook Sliders",
		moveDesc: "along ranks and files",
		captureDesc: "along ranks and files"
	}),
	() => new SliderGeometry(getBishopAttacks, {
		name: "Bishop Sliders",
		moveDesc: "along diagonals",
		captureDesc: "along diagonals"
	}),
	() => new LeaperGeometry(getKnightAttacks, {
		name: "Knight Leaps",
		moveDesc: "according to standard knight jumps",
		captureDesc: "according to standard knight jumps"
	}),
	() => new AroundGeometry({ dist: 1 }),
	() => new AroundGeometry({ dist: 2 }),
	() => new SinglePushGeometry(),
	() => new DiagonalGeometry(),
	() => new DiagonalGeometry()
];

// Pool 2: Highly specific contextual moves (separate them so you can control their rarity)
export const SPECIAL_GEOMETRY_POOL: (() => MoveGeometry | CanOnlyCapture<MoveGeometry> | CannotCapture<MoveGeometry>)[] = [
	() => new DoublePushGeometry(),
	() => new EnPassantGeometry(),
	() => new CastleGeometry()
];

// Pool 3: Post-processing pipeline adjustments
export const MODIFIER_POOL: (() => StrategyModifier)[] = [
	() => new PromotionModifier()
];
