import { PieceStrategy } from "@/app/strategies/Strategy";
import { GeneratorContext } from "@/app/Generator";
import { Color, Move } from "@/app/utils/types";
import { u64 } from "@/app/utils/bitUtils";

export abstract class BasePushStrategy implements PieceStrategy {
	public captureMode = false;

	constructor() {}

	// Shared execution signature required by all piece generators
	abstract generate(fromSq: number, color: Color, ctx: GeneratorContext): Move[];

	capturesOnly(): this {
		this.captureMode = true;
		return this;
	}

	/**
	 * Shifts a bitboard mask forward relative to the player's color
	 */
	protected shiftForward(mask: bigint, color: Color, steps: number): bigint {
		let result = mask;
		for (let i = 0; i < steps; i++) {
			result = color === Color.White ? u64(result << 8n) : u64(result >> 8n);
		}
		return result;
	}
}
